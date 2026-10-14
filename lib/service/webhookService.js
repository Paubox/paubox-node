'use strict';

const axios = require('axios');

// Client for the Paubox webhooks service.
//
// Authenticates with a scoped API key sent as `Authorization: Bearer <key>`,
// the same scheme as the Forms API and unlike the Email API's
// `Token token=`. Which events a key may subscribe to is decided by its
// scopes; asking for one it is not scoped for is refused with 403.
class webhookService {
  constructor(config = {}) {
    config = Object.assign(
      {
        apiKey: process.env.WEBHOOKS_API_KEY,
        baseURL: process.env.WEBHOOKS_BASE_URL,
      },
      config,
    );
    // The public gateway exposes only /v1/webhooks/endpoints and rewrites it
    // onto the service's own /v1/endpoints, so the producers' event-ingest
    // route is unreachable from here. The bare base is deliberately unrouted —
    // every request below carries the /endpoints resource.
    this.baseURL = config.baseURL || 'https://api.paubox.com/v1/webhooks';
    this.apiKey = config.apiKey || null;
  }

  // List the webhook endpoints this key can act on.
  //
  // Endpoints carrying an event the key is not scoped for are filtered out by
  // the service, so this is what the key may manage rather than everything on
  // the account.
  //
  // params is optional: { page, items }
  //
  // returns a promise resolving to { data, page_info }. Note page_info.count
  // is the total number of matching endpoints, not the length of this page.
  //
  async listWebhookEndpoints(params = {}) {
    this._requireApiKey();
    const queryParams = {};
    for (const key of ['page', 'items']) {
      if (params && params[key] !== undefined && params[key] !== null) {
        queryParams[key] = params[key];
      }
    }
    const response = await this._authorizedAxios().get('/endpoints', {
      params: queryParams,
    });
    return response.data;
  }

  // Subscribe a URL to one or more events.
  //
  // params: { target_url, events }
  //
  // target_url must be an https URL resolving to a publicly routable address.
  //
  // Event names are not validated here on purpose: the catalog belongs to the
  // service and grows without an SDK release. An unknown event comes back as
  // 422, one this key is not scoped for as 403.
  //
  // returns a promise resolving to the created endpoint, including
  // signing_secret — which the service returns ONLY here. Store it on
  // receipt; a lost secret means replacing the endpoint.
  //
  async createWebhookEndpoint(params = {}) {
    this._requireApiKey();
    if (!params || typeof params !== 'object' || Array.isArray(params)) {
      throw new Error('params is required and must be an object');
    }
    if (!params.target_url) {
      throw new Error('target_url is required');
    }
    if (!Array.isArray(params.events) || params.events.length === 0) {
      throw new Error('events is required and must be a non-empty array');
    }
    const response = await this._authorizedAxios().post('/endpoints', {
      target_url: params.target_url,
      events: params.events,
    });
    return this._unwrapData(response.data);
  }

  // Retrieve a single webhook endpoint by its UUID.
  //
  // The response does not include the signing secret; it is available only
  // from createWebhookEndpoint.
  //
  async getWebhookEndpoint(endpointId) {
    this._requireApiKey();
    const id = this._pathSegment('endpointId', endpointId);
    const response = await this._authorizedAxios().get('/endpoints/' + id);
    return this._unwrapData(response.data);
  }

  // Update an existing endpoint. Only the provided fields are sent, so an
  // update that moves target_url leaves events and status untouched.
  //
  // updates may contain: target_url, status ('active'|'disabled'), events
  //
  async updateWebhookEndpoint(endpointId, updates = {}) {
    this._requireApiKey();
    const id = this._pathSegment('endpointId', endpointId);
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new Error('updates is required and must be an object');
    }
    const body = {};
    for (const key of ['target_url', 'status', 'events']) {
      if (updates[key] !== undefined && updates[key] !== null) {
        body[key] = updates[key];
      }
    }
    if (Object.keys(body).length === 0) {
      throw new Error('updates must include at least one of: target_url, status, events');
    }
    const response = await this._authorizedAxios().patch('/endpoints/' + id, body);
    return this._unwrapData(response.data);
  }

  // Delete an endpoint, stopping every event on it.
  //
  // The service answers 204 with no body, so this resolves to undefined.
  //
  async deleteWebhookEndpoint(endpointId) {
    this._requireApiKey();
    const id = this._pathSegment('endpointId', endpointId);
    await this._authorizedAxios().delete('/endpoints/' + id);
  }

  // Single resources arrive wrapped as { data: {...} }. Unwrapped so callers
  // get the endpoint rather than an envelope carrying nothing else.
  //
  // listWebhookEndpoints deliberately does not use this: its envelope also
  // carries page_info, which a caller paginating needs.
  //
  _unwrapData(body) {
    if (body && typeof body === 'object' && body.data !== undefined) {
      return body.data;
    }
    throw this._unexpectedResponseError(body);
  }

  // Every endpoint here is authenticated, so fail before building a request
  // rather than sending an unauthenticated one.
  //
  _requireApiKey() {
    if (!this.apiKey) {
      throw new Error(
        'apiKey is required for this method. Pass { apiKey } to webhookService() or set the WEBHOOKS_API_KEY environment variable.',
      );
    }
  }

  // Validate a caller-supplied id before interpolating it into a URL path.
  // Without this an id like '../events' would steer the credentialed request
  // to an unintended path — and since the Authorization header goes on the
  // same host, the key would ride along. Every id on this service is a UUID,
  // so unlike the Forms client there is no non-UUID fallback here.
  //
  _pathSegment(name, value) {
    if (value === undefined || value === null || value === '') {
      throw new Error(name + ' is required');
    }
    if (typeof value !== 'string') {
      throw new Error(name + ' must be a string');
    }
    if (!webhookService.UUID_RE.test(value)) {
      throw new Error(name + ' must be a UUID');
    }
    return encodeURIComponent(value);
  }

  // Wrap an unexpected response body in a real Error without serializing the
  // body onto an enumerable property, so a logger that stringifies the error
  // cannot spill response content. The body stays reachable on the
  // non-enumerable `body` property for debugging.
  //
  _unexpectedResponseError(body) {
    const error = new Error('Unexpected response from Paubox webhooks API');
    Object.defineProperty(error, 'body', {
      value: body,
      enumerable: false,
      writable: false,
    });
    return error;
  }

  // Builds an axios instance carrying the Authorization header.
  //
  // The response interceptor replaces any rejected axios error with a narrow
  // one carrying only the caller-useful fields. The raw axios error is
  // discarded because it keeps the outbound request — and so the
  // `Authorization: Bearer <token>` header — in several enumerable places
  // (error.config.headers, error.request._header, error.request.headers,
  // error.request.options.headers, error.request._redirectable._options...),
  // and the exact set varies by transport and axios version. Rebuilding a
  // clean error is version-independent: a caller that logs or serializes it
  // cannot leak the key.
  //
  _authorizedAxios(extraConfig = {}) {
    const instance = axios.create(
      Object.assign(
        {
          baseURL: this.baseURL,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.apiKey,
          },
        },
        extraConfig,
      ),
    );
    instance.interceptors.response.use(undefined, (error) => {
      return Promise.reject(this._sanitizeRequestError(error));
    });
    return instance;
  }

  // Build a token-free error from an axios error. Copies only message, code,
  // and a trimmed response (status/statusText/data) — never config or
  // request, which carry the Authorization header.
  //
  // The service answers failures as {"message": "..."}, so that text is
  // promoted onto the error message: a caller sees "target_url: must be an
  // https URL" rather than "Request failed with status code 422".
  //
  _sanitizeRequestError(error) {
    if (!error || typeof error !== 'object') {
      return error;
    }
    const serviceMessage =
      error.response && error.response.data && typeof error.response.data.message === 'string'
        ? error.response.data.message
        : null;
    const safe = new Error(serviceMessage || error.message || 'Paubox webhooks API request failed');
    if (error.name) {
      safe.name = error.name;
    }
    if (error.code !== undefined) {
      safe.code = error.code;
    }
    if (error.response) {
      safe.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      };
      safe.status = error.response.status;
    }
    return safe;
  }
}

// Canonical UUID (8-4-4-4-12 hex). Used to validate id path segments before
// they are interpolated into a credentialed request URL.
webhookService.UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
module.exports = function (config) {
  return new webhookService(config);
};
