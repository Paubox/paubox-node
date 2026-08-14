'use strict';

const axios = require('axios');

class formService {
  constructor(config = {}) {
    config = Object.assign(
      {
        apiKey: process.env.FORMS_API_KEY,
        baseURL: process.env.FORMS_BASE_URL,
      },
      config,
    );
    this.baseURL = config.baseURL || 'https://api.paubox.com/forms';
    this.apiKey = config.apiKey || null;
  }

  // Get the full form definition (HTML, JSON schema, CSS) for a given form.
  //
  // https://docs.paubox.com/forms/get-form
  //
  // No authentication required.
  //
  // formId is the UUID of the form to retrieve
  //
  // returns a promise that resolves to the form object
  //
  async getForm(formId) {
    // Public route: no credential is attached, so no UUID requirement, but
    // still encode the segment so a caller-supplied value can't splice the
    // path.
    const formSegment = this._pathSegment('formId', formId, { requireUuid: false });

    const axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await axiosInstance({
      method: 'GET',
      url: `/public/form_data/${formSegment}`,
    });

    const form = response.data;

    if (!form || !form.id) {
      throw this._unexpectedResponseError(form);
    }

    return form;
  }

  // Submit a respondent's answers for a form.
  //
  // https://docs.paubox.com/forms/submit-form
  //
  // No authentication required. Maximum request size is 250 MB.
  //
  // formId is the UUID of the form being submitted
  //
  // formData is a key-value object matching the form's field schema (form_json)
  //
  // attachments is an optional array of objects with name (filename) and
  // content (base64-encoded file content) fields
  //
  // returns a promise that resolves to null on success (201 No Content)
  //
  async submitForm(formId, formData, attachments = null) {
    // Public route: no credential is attached, so no UUID requirement, but
    // still encode the segment so a caller-supplied value can't splice the
    // path.
    const formSegment = this._pathSegment('formId', formId, { requireUuid: false });
    if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
      throw new Error('formData is required and must be an object');
    }

    const requestBody = { form_data: formData };

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      requestBody.attachments = attachments;
    }

    const axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: { 'Content-Type': 'application/json' },
      maxBodyLength: 250 * 1024 * 1024,
      maxContentLength: 250 * 1024 * 1024,
    });

    await axiosInstance({
      method: 'POST',
      url: `/api/forms/${formSegment}/submissions`,
      data: requestBody,
    });

    return null;
  }

  // Throws when no API key was configured. Called by every authenticated
  // method before making a request.
  //
  _requireApiKey() {
    if (!this.apiKey) {
      throw new Error(
        'apiKey is required for this method. Pass { apiKey } to formService() or set the FORMS_API_KEY environment variable.',
      );
    }
  }

  // Validate a caller-supplied value before interpolating it into a URL
  // path. Without this an id like '../stats' or 'id?x=' would steer the
  // credentialed request to an unintended path. requireUuid enforces the
  // canonical UUID shape (the authenticated routes take UUIDs); public
  // routes pass requireUuid=false and are only encoded. Returns the
  // encoded segment.
  //
  _pathSegment(name, value, { requireUuid = true } = {}) {
    if (value === undefined || value === null || value === '') {
      throw new Error(name + ' is required');
    }
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new Error(name + ' must be a string');
    }
    const str = String(value);
    if (requireUuid && !formService.UUID_RE.test(str)) {
      throw new Error(name + ' must be a UUID');
    }
    return encodeURIComponent(str);
  }

  // Wrap an unexpected/invalid response body in a real Error without
  // serializing the body onto an enumerable property (a logger that
  // stringifies the error must not spill response content). The body is
  // still reachable on the non-enumerable `body` property for debugging.
  //
  _unexpectedResponseError(body) {
    const error = new Error('Unexpected response from Forms API');
    Object.defineProperty(error, 'body', {
      value: body,
      enumerable: false,
      writable: false,
    });
    return error;
  }

  // Builds an axios instance with the Authorization header for
  // authenticated requests. extraConfig extends the base config
  // (e.g. responseType).
  //
  // A response interceptor replaces any rejected axios error with a narrow
  // error that carries only the caller-useful fields (message, code, and a
  // trimmed response with status/statusText/data). The raw axios error is
  // discarded because it keeps the outbound request — and thus the
  // Authorization: Bearer <token> header — in several enumerable places
  // (error.config.headers, error.request._header, error.request.headers,
  // error.request.options.headers, error.request._redirectable._options...),
  // and the exact set varies by transport and axios version. Reconstructing
  // a clean error is version-independent: a caller that logs or serializes
  // it (JSON.stringify, util.inspect, an error tracker) cannot leak the
  // bearer token.
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

  // Build a token-free error from an axios error. Copies only message,
  // code, and a trimmed response (status/statusText/data) — never config
  // or request, which carry the Authorization header.
  //
  _sanitizeRequestError(error) {
    if (!error || typeof error !== 'object') {
      return error;
    }

    const safe = new Error(error.message || 'Forms API request failed');
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

  // List the customer's forms with optional filtering, ordering, and
  // pagination.
  //
  // Requires a scoped API key with the forms scope.
  //
  // params must include customer_id (the server authorizes on it and
  // returns 403 when it is absent). Other keys are optional and only sent
  // when provided: form_id, search, order ('asc'|'desc'), order_by
  // ('title'|'updated_at'|'submission_count'), archived (bool), active
  // (bool), page, items (max 100)
  //
  // returns a promise that resolves to { results, page_info }
  //
  async listForms(params = {}) {
    this._requireApiKey();

    if (!params || typeof params !== 'object' || Array.isArray(params)) {
      throw new Error('params is required and must be an object');
    }
    if (
      params.customer_id === undefined ||
      params.customer_id === null ||
      params.customer_id === ''
    ) {
      throw new Error('customer_id is required');
    }

    const allowedParams = [
      'customer_id',
      'form_id',
      'search',
      'order',
      'order_by',
      'archived',
      'active',
      'page',
      'items',
    ];

    const queryParams = {};
    for (const key of allowedParams) {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams[key] = params[key];
      }
    }

    const axiosInstance = this._authorizedAxios();

    const response = await axiosInstance({
      method: 'GET',
      url: '/api/forms',
      params: queryParams,
    });

    if (!response.data || !Array.isArray(response.data.results)) {
      throw this._unexpectedResponseError(response.data);
    }

    return response.data;
  }

  // Get a single form by id. Unlike getForm, this returns any of the
  // customer's forms, including archived and inactive ones.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form to retrieve
  //
  // returns a promise that resolves to the form object
  //
  async getFormById(formId) {
    this._requireApiKey();

    const formSegment = this._pathSegment('formId', formId);

    const axiosInstance = this._authorizedAxios();

    const response = await axiosInstance({
      method: 'GET',
      url: `/api/forms/${formSegment}`,
    });

    if (!response.data || !response.data.data || !response.data.data.id) {
      throw this._unexpectedResponseError(response.data);
    }

    return response.data.data;
  }

  // Create a new form.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formAttributes is an object with required fields title (string),
  // form_json (object), customer_id, and version; optional fields are
  // description, form_html, form_css, recipient, signable,
  // signature_confirmation_label, subscription_list_id, type, active,
  // and submission_count
  //
  // returns a promise that resolves to { id } for the new form
  //
  async createForm(formAttributes) {
    this._requireApiKey();

    if (!formAttributes || typeof formAttributes !== 'object' || Array.isArray(formAttributes)) {
      throw new Error('formAttributes is required and must be an object');
    }

    const requiredFields = ['title', 'form_json', 'customer_id', 'version'];
    for (const field of requiredFields) {
      if (formAttributes[field] === undefined || formAttributes[field] === null) {
        throw new Error(`${field} is required`);
      }
    }

    const allowedFields = [
      'title',
      'form_json',
      'customer_id',
      'version',
      'description',
      'form_html',
      'form_css',
      'recipient',
      'signable',
      'signature_confirmation_label',
      'subscription_list_id',
      'type',
      'active',
      'submission_count',
    ];

    const requestBody = {};
    for (const field of allowedFields) {
      if (formAttributes[field] !== undefined) {
        requestBody[field] = formAttributes[field];
      }
    }

    const axiosInstance = this._authorizedAxios();

    const response = await axiosInstance({
      method: 'POST',
      url: '/api/forms',
      data: requestBody,
    });

    if (!response.data || !response.data.id) {
      throw this._unexpectedResponseError(response.data);
    }

    return response.data;
  }

  // Update an existing form. Only the provided keys are changed; omitted
  // keys are left unchanged server-side.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form to update
  //
  // updates is an object with at least one of: title, description,
  // form_json, recipient, active, subscription_list_id
  //
  // returns a promise that resolves to { detail, form_id }
  //
  async updateForm(formId, updates) {
    this._requireApiKey();

    const formSegment = this._pathSegment('formId', formId);
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new Error('updates is required and must be an object');
    }

    const updatableFields = [
      'title',
      'description',
      'form_json',
      'recipient',
      'active',
      'subscription_list_id',
    ];

    const requestBody = {};
    for (const field of updatableFields) {
      if (updates[field] !== undefined) {
        requestBody[field] = updates[field];
      }
    }

    if (Object.keys(requestBody).length === 0) {
      throw new Error('updates must include at least one updatable field');
    }

    const axiosInstance = this._authorizedAxios();

    const response = await axiosInstance({
      method: 'PUT',
      url: `/api/forms/${formSegment}`,
      data: requestBody,
    });

    if (!response.data || !response.data.detail) {
      throw this._unexpectedResponseError(response.data);
    }

    return response.data;
  }

  // Archive a form. The server also sets active to false.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form to archive
  //
  // returns a promise that resolves to { detail }
  //
  async archiveForm(formId) {
    this._requireApiKey();

    const formSegment = this._pathSegment('formId', formId);

    const axiosInstance = this._authorizedAxios();

    const response = await axiosInstance({
      method: 'POST',
      url: `/api/forms/${formSegment}/archive`,
    });

    if (!response.data || !response.data.detail) {
      throw this._unexpectedResponseError(response.data);
    }

    return response.data;
  }

  // Unarchive a previously archived form.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form to unarchive
  //
  // returns a promise that resolves to { detail }
  //
  async unarchiveForm(formId) {
    this._requireApiKey();

    const formSegment = this._pathSegment('formId', formId);

    const axiosInstance = this._authorizedAxios();

    const response = await axiosInstance({
      method: 'POST',
      url: `/api/forms/${formSegment}/unarchive`,
    });

    if (!response.data || !response.data.detail) {
      throw this._unexpectedResponseError(response.data);
    }

    return response.data;
  }

  // Copy an existing form to a new form with the given title. The copy
  // gets a fresh id, a null vanity_url, and a submission_count of 0.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form to copy
  //
  // title is the title for the new form
  //
  // returns a promise that resolves to the new form object
  //
  async copyForm(formId, title) {
    this._requireApiKey();

    if (!formId) {
      throw new Error('formId is required');
    }
    if (!title) {
      throw new Error('title is required');
    }

    const axiosInstance = this._authorizedAxios();

    const response = await axiosInstance({
      method: 'POST',
      url: '/api/forms/copy',
      data: { form_id: formId, title: title },
    });

    if (!response.data || !response.data.id) {
      throw this._unexpectedResponseError(response.data);
    }

    return response.data;
  }

  // Get aggregate form statistics for a customer.
  //
  // Requires a scoped API key with the forms scope.
  //
  // customerId is optional; when omitted the server defaults to the API
  // key's customer
  //
  // returns a promise that resolves to { active_form_count,
  // total_submission_count, submissions_last_7_days }
  //
  async getFormStats(customerId = null) {
    this._requireApiKey();

    const queryParams = {};
    if (customerId !== undefined && customerId !== null) {
      queryParams.customer_id = customerId;
    }

    const axiosInstance = this._authorizedAxios();

    const response = await axiosInstance({
      method: 'GET',
      url: '/api/forms/stats',
      params: queryParams,
    });

    if (!response.data || response.data.active_form_count === undefined) {
      throw this._unexpectedResponseError(response.data);
    }

    return response.data;
  }

  // List a form's submissions with optional filtering, ordering, and
  // pagination.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form whose submissions to list
  //
  // params is an optional object; only provided keys are sent as query
  // parameters: submission_id, order_by ('submitter_email'), order
  // ('asc'|'desc'), page, items (max 100)
  //
  // returns a promise that resolves to { data, total, page, items }
  //
  async listSubmissions(formId, params = {}) {
    this._requireApiKey();

    const formSegment = this._pathSegment('formId', formId);

    const allowedParams = ['submission_id', 'order_by', 'order', 'page', 'items'];

    const queryParams = {};
    for (const key of allowedParams) {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams[key] = params[key];
      }
    }

    const axiosInstance = this._authorizedAxios();

    const response = await axiosInstance({
      method: 'GET',
      url: `/api/forms/${formSegment}/submissions`,
      params: queryParams,
    });

    if (!response.data || !Array.isArray(response.data.data)) {
      throw this._unexpectedResponseError(response.data);
    }

    return response.data;
  }

  // Export a form's submissions as CSV ('Created At' column followed by
  // the form's field labels).
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form whose submissions to export
  //
  // submissionId is optional; when provided, only that submission is
  // exported
  //
  // returns a promise that resolves to the CSV content as a string
  //
  async exportSubmissionsCsv(formId, submissionId = null) {
    this._requireApiKey();

    const formSegment = this._pathSegment('formId', formId);

    let url = `/api/forms/${formSegment}/submissions/submission-csv`;
    if (submissionId !== undefined && submissionId !== null) {
      url += `/${this._pathSegment('submissionId', submissionId)}`;
    }

    const axiosInstance = this._authorizedAxios({ responseType: 'text' });

    const response = await axiosInstance({
      method: 'GET',
      url: url,
    });

    if (typeof response.data !== 'string') {
      throw this._unexpectedResponseError(response.data);
    }

    return response.data;
  }

  // Export a single submission as a PDF.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form the submission belongs to
  //
  // submissionId is the UUID of the submission to export
  //
  // returns a promise that resolves to the binary PDF content
  //
  async exportSubmissionPdf(formId, submissionId) {
    this._requireApiKey();

    const formSegment = this._pathSegment('formId', formId);
    const submissionSegment = this._pathSegment('submissionId', submissionId);

    const axiosInstance = this._authorizedAxios({ responseType: 'arraybuffer' });

    const response = await axiosInstance({
      method: 'GET',
      url: `/api/forms/${formSegment}/submissions/${submissionSegment}/submission-pdf`,
    });

    if (response.data === null || response.data === undefined) {
      throw this._unexpectedResponseError(response.data);
    }

    return response.data;
  }
}

// Canonical UUID (8-4-4-4-12 hex). Used to validate id path segments before
// they are interpolated into a credentialed request URL.
formService.UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = function (config) {
  return new formService(config);
};
