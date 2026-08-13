const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const nock = require('nock');
const util = require('util');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const baseURL = 'https://forms.test';
const formId = '550e8400-e29b-41d4-a716-446655440000';
const submissionId = 'b3b8c7e2-1d2f-4c5a-9e8d-7f6a5b4c3d2e';

// The authenticated methods that interpolate a caller-supplied id into the
// request path. Each entry invokes the method with a hostile formId.
const idPathMethods = [
  (s, id) => s.getFormById(id),
  (s, id) => s.updateForm(id, { title: 'x' }),
  (s, id) => s.archiveForm(id),
  (s, id) => s.unarchiveForm(id),
  (s, id) => s.listSubmissions(id),
  (s, id) => s.exportSubmissionsCsv(id),
  (s, id) => s.exportSubmissionPdf(id, submissionId),
];

const hostileIds = [
  '..',
  '../..',
  '..%2F..%2Fadmin',
  formId + '/archive',
  'a?x=1',
  'a#frag',
  'a b',
];

describe('formService security hardening', function () {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('never issues a request when the id path segment is hostile (no retarget with the bearer)', async function () {
    // disableNetConnect is active and no interceptor is registered, so any
    // request that escaped validation would reject with a net-connect error
    // (a different message) rather than the UUID validation error asserted
    // here. This proves the credentialed request is not retargeted.
    const service = formService({ apiKey, baseURL });
    for (const invoke of idPathMethods) {
      for (const bad of hostileIds) {
        await expect(invoke(service, bad)).to.be.rejectedWith(/must be a UUID/);
      }
    }
  });

  it('strips the Authorization header from a propagated error on every authenticated method', async function () {
    const service = formService({ apiKey, baseURL });

    const calls = [
      () => {
        nock(baseURL).get('/api/forms').query(true).reply(500, { detail: 'boom' });
        return service.listForms({ customer_id: 629 });
      },
      () => {
        nock(baseURL)
          .get('/api/forms/' + formId)
          .reply(500, { detail: 'boom' });
        return service.getFormById(formId);
      },
      () => {
        nock(baseURL).post('/api/forms').reply(500, { detail: 'boom' });
        return service.createForm({ title: 't', form_json: {}, customer_id: 629, version: 1 });
      },
      () => {
        nock(baseURL)
          .put('/api/forms/' + formId)
          .reply(500, { detail: 'boom' });
        return service.updateForm(formId, { title: 'x' });
      },
      () => {
        nock(baseURL)
          .post('/api/forms/' + formId + '/archive')
          .reply(500, { detail: 'boom' });
        return service.archiveForm(formId);
      },
      () => {
        nock(baseURL)
          .post('/api/forms/' + formId + '/unarchive')
          .reply(500, { detail: 'boom' });
        return service.unarchiveForm(formId);
      },
      () => {
        nock(baseURL).post('/api/forms/copy').reply(500, { detail: 'boom' });
        return service.copyForm(formId, 'copy');
      },
      () => {
        nock(baseURL).get('/api/forms/stats').query(true).reply(500, { detail: 'boom' });
        return service.getFormStats();
      },
      () => {
        nock(baseURL)
          .get('/api/forms/' + formId + '/submissions')
          .query(true)
          .reply(500, { detail: 'boom' });
        return service.listSubmissions(formId);
      },
      () => {
        nock(baseURL)
          .get('/api/forms/' + formId + '/submissions/submission-csv')
          .reply(500, 'boom', { 'Content-Type': 'text/plain' });
        return service.exportSubmissionsCsv(formId);
      },
      () => {
        nock(baseURL)
          .get('/api/forms/' + formId + '/submissions/' + submissionId + '/submission-pdf')
          .reply(500, 'boom', { 'Content-Type': 'text/plain' });
        return service.exportSubmissionPdf(formId, submissionId);
      },
    ];

    for (const call of calls) {
      let caught;
      try {
        await call();
      } catch (error) {
        caught = error;
      }
      expect(caught, 'expected the call to reject').to.not.equal(undefined);
      // The propagated error carries no request/config branch at all — those
      // are where axios (and follow-redirects) keep the Authorization header.
      expect(caught).to.not.have.property('config');
      expect(caught).to.not.have.property('request');
      // And the token appears via no serialization or deep-inspection path.
      expect(JSON.stringify(caught)).to.not.contain(apiKey);
      expect(util.inspect(caught, { depth: null })).to.not.contain(apiKey);
      // Caller-useful fields survive the sanitization.
      expect(caught.response.status).to.equal(500);
    }
  });
});

describe('formService baseURL resolution', function () {
  it('prefers config.baseURL over FORMS_BASE_URL and the prod default', function () {
    const saved = process.env.FORMS_BASE_URL;
    process.env.FORMS_BASE_URL = 'https://from-env.test';
    try {
      expect(formService({ apiKey, baseURL: 'https://from-config.test' }).baseURL).to.equal(
        'https://from-config.test',
      );
    } finally {
      if (saved === undefined) {
        delete process.env.FORMS_BASE_URL;
      } else {
        process.env.FORMS_BASE_URL = saved;
      }
    }
  });

  it('falls back to FORMS_BASE_URL when no config is given', function () {
    const saved = process.env.FORMS_BASE_URL;
    process.env.FORMS_BASE_URL = 'https://from-env.test';
    try {
      expect(formService({ apiKey }).baseURL).to.equal('https://from-env.test');
    } finally {
      if (saved === undefined) {
        delete process.env.FORMS_BASE_URL;
      } else {
        process.env.FORMS_BASE_URL = saved;
      }
    }
  });

  it('falls back to the production default when neither is set', function () {
    const saved = process.env.FORMS_BASE_URL;
    delete process.env.FORMS_BASE_URL;
    try {
      expect(formService({ apiKey }).baseURL).to.equal('https://api.paubox.com/forms');
    } finally {
      if (saved !== undefined) {
        process.env.FORMS_BASE_URL = saved;
      }
    }
  });
});
