const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const nock = require('nock');

const webhookService = require('../src/service/webhookService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const baseURL = 'https://webhooks.test';
const endpointId = '2ec66c21-bf48-48eb-8d28-f80b2d6b77c7';

const endpoint = {
  id: endpointId,
  target_url: 'https://hooks.example.com/paubox',
  status: 'active',
  events: ['forms.submission.created'],
  created_at: '2026-10-09T01:43:41.639968+00:00',
  updated_at: '2026-10-09T01:43:41.639968+00:00',
};

function client() {
  return webhookService({ apiKey, baseURL });
}

describe('webhookService', function () {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  describe('construction', function () {
    it('defaults to the production base URL', function () {
      expect(webhookService({ apiKey }).baseURL).to.equal('https://api.paubox.com/v1/webhooks');
    });

    it('rejects every method when no apiKey is configured', async function () {
      const svc = webhookService({ baseURL });
      await expect(svc.listWebhookEndpoints()).to.be.rejectedWith(/WEBHOOKS_API_KEY/);
      await expect(svc.getWebhookEndpoint(endpointId)).to.be.rejectedWith(/WEBHOOKS_API_KEY/);
      await expect(svc.deleteWebhookEndpoint(endpointId)).to.be.rejectedWith(/WEBHOOKS_API_KEY/);
    });
  });

  describe('listWebhookEndpoints', function () {
    it('sends a Bearer Authorization header to /endpoints', async function () {
      nock(baseURL, { reqheaders: { authorization: 'Bearer ' + apiKey } })
        .get('/endpoints')
        .reply(200, { data: [endpoint], page_info: { count: 1, items: 50 } });

      const result = await client().listWebhookEndpoints();
      expect(result.data).to.have.lengthOf(1);
      expect(result.data[0].id).to.equal(endpointId);
    });

    it('keeps the page_info envelope', async function () {
      // count is the total, not the length of this page.
      nock(baseURL)
        .get('/endpoints')
        .reply(200, { data: [endpoint], page_info: { count: 2, items: 1 } });

      const result = await client().listWebhookEndpoints();
      expect(result.page_info.count).to.equal(2);
      expect(result.data).to.have.lengthOf(1);
    });

    it('sends pagination params when given', async function () {
      nock(baseURL)
        .get('/endpoints')
        .query({ page: 2, items: 1 })
        .reply(200, { data: [], page_info: { count: 0, items: 1 } });

      await client().listWebhookEndpoints({ page: 2, items: 1 });
      expect(nock.isDone()).to.equal(true);
    });
  });

  describe('createWebhookEndpoint', function () {
    it('returns the signing secret, which the service sends only here', async function () {
      nock(baseURL)
        .post('/endpoints', {
          target_url: 'https://hooks.example.com/paubox',
          events: ['forms.submission.created'],
        })
        .reply(201, {
          data: Object.assign({}, endpoint, { signing_secret: 'whsec_abc123' }),
          message: 'Store this signing_secret now — it is not shown again.',
        });

      const created = await client().createWebhookEndpoint({
        target_url: 'https://hooks.example.com/paubox',
        events: ['forms.submission.created'],
      });
      expect(created.signing_secret).to.equal('whsec_abc123');
      expect(created.id).to.equal(endpointId);
    });

    it('validates locally before sending', async function () {
      const svc = client();
      await expect(svc.createWebhookEndpoint({})).to.be.rejectedWith(/target_url is required/);
      await expect(
        svc.createWebhookEndpoint({ target_url: 'https://e.test/h' }),
      ).to.be.rejectedWith(/events is required/);
      await expect(
        svc.createWebhookEndpoint({ target_url: 'https://e.test/h', events: [] }),
      ).to.be.rejectedWith(/events is required/);
    });

    // The catalog belongs to the service and grows without an SDK release, so
    // an unrecognised name must reach the server rather than be rejected here.
    it('does not validate event names', async function () {
      nock(baseURL)
        .post('/endpoints', {
          target_url: 'https://e.test/h',
          events: ['some.future.event'],
        })
        .reply(201, { data: endpoint });

      await client().createWebhookEndpoint({
        target_url: 'https://e.test/h',
        events: ['some.future.event'],
      });
      expect(nock.isDone()).to.equal(true);
    });
  });

  describe('getWebhookEndpoint', function () {
    it('unwraps the data envelope', async function () {
      nock(baseURL)
        .get('/endpoints/' + endpointId)
        .reply(200, { data: endpoint });

      const result = await client().getWebhookEndpoint(endpointId);
      expect(result.id).to.equal(endpointId);
      expect(result.status).to.equal('active');
      // The secret exists only on the create response.
      expect(result.signing_secret).to.equal(undefined);
    });

    it('rejects a non-UUID id before any request', async function () {
      await expect(client().getWebhookEndpoint('not-a-uuid')).to.be.rejectedWith(/must be a UUID/);
    });

    it('rejects a path-traversal id before any request', async function () {
      await expect(client().getWebhookEndpoint('../endpoints')).to.be.rejectedWith(
        /must be a UUID/,
      );
    });
  });

  describe('updateWebhookEndpoint', function () {
    it('PATCHes only the provided fields', async function () {
      nock(baseURL)
        .patch('/endpoints/' + endpointId, { status: 'disabled' })
        .reply(200, { data: Object.assign({}, endpoint, { status: 'disabled' }) });

      const result = await client().updateWebhookEndpoint(endpointId, {
        status: 'disabled',
      });
      expect(result.status).to.equal('disabled');
    });

    it('rejects an update with nothing to change', async function () {
      await expect(client().updateWebhookEndpoint(endpointId, {})).to.be.rejectedWith(
        /at least one of/,
      );
    });
  });

  describe('deleteWebhookEndpoint', function () {
    it('resolves on an empty 204', async function () {
      nock(baseURL)
        .delete('/endpoints/' + endpointId)
        .reply(204);

      await expect(client().deleteWebhookEndpoint(endpointId)).to.be.fulfilled;
      expect(nock.isDone()).to.equal(true);
    });
  });

  describe('errors', function () {
    it('promotes the service message onto the error', async function () {
      nock(baseURL).post('/endpoints').reply(422, { message: 'target_url: must be an https URL' });

      await expect(
        client().createWebhookEndpoint({
          target_url: 'http://insecure.test',
          events: ['forms.submission.created'],
        }),
      ).to.be.rejectedWith('target_url: must be an https URL');
    });

    it('carries the status for a 403', async function () {
      nock(baseURL)
        .get('/endpoints')
        .reply(403, { message: "events: not entitled to 'api_mail_log_delivered'" });

      const err = await client()
        .listWebhookEndpoints()
        .catch((e) => e);
      expect(err.status).to.equal(403);
      expect(err.message).to.contain('not entitled');
    });

    // A duplicate target_url is 422, not 409 — mapping keyed on 409 misses it.
    it('reports a duplicate target_url as 422', async function () {
      nock(baseURL)
        .post('/endpoints')
        .reply(422, { message: 'target_url: an endpoint already exists for this URL' });

      const err = await client()
        .createWebhookEndpoint({
          target_url: 'https://e.test/h',
          events: ['forms.submission.created'],
        })
        .catch((e) => e);
      expect(err.status).to.equal(422);
      expect(err.message).to.contain('already exists');
    });

    // The raw axios error keeps the outbound request, and with it the bearer
    // token, in several enumerable places. The sanitized error must not.
    it('does not leak the Authorization header on failure', async function () {
      nock(baseURL).get('/endpoints').reply(500, { message: 'boom' });

      const err = await client()
        .listWebhookEndpoints()
        .catch((e) => e);
      const serialized = JSON.stringify(err, Object.getOwnPropertyNames(err));
      expect(serialized).to.not.contain(apiKey);
      expect(err.config).to.equal(undefined);
      expect(err.request).to.equal(undefined);
    });
  });
});
