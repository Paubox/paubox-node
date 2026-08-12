const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const nock = require('nock');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const baseURL = 'https://forms.test';
const formId = '550e8400-e29b-41d4-a716-446655440000';
const submissionId = 'b3b8c7e2-1d2f-4c5a-9e8d-7f6a5b4c3d2e';

const csvBody = 'Created At,First Name\n2026-08-11,Jane\n';

describe('formService.exportSubmissionsCsv', function () {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('can export all submissions as CSV', async function () {
    nock(baseURL)
      .get('/api/forms/' + formId + '/submissions/submission-csv')
      .reply(200, csvBody, { 'Content-Type': 'text/csv' });

    const service = formService({ apiKey, baseURL });
    const response = await service.exportSubmissionsCsv(formId);
    expect(response).to.be.a('string');
    expect(response).to.equal(csvBody);
  });

  it('sends the Bearer Authorization header and text responseType to the collection url', async function () {
    const scope = nock(baseURL, {
      reqheaders: { authorization: 'Bearer ' + apiKey },
    })
      .get('/api/forms/' + formId + '/submissions/submission-csv')
      .reply(200, csvBody, { 'Content-Type': 'text/csv' });

    const service = formService({ apiKey, baseURL });
    await service.exportSubmissionsCsv(formId);
    expect(scope.isDone()).to.equal(true);
  });

  it('appends the submissionId to the url when provided', async function () {
    const scope = nock(baseURL)
      .get('/api/forms/' + formId + '/submissions/submission-csv/' + submissionId)
      .reply(200, csvBody, { 'Content-Type': 'text/csv' });

    const service = formService({ apiKey, baseURL });
    await service.exportSubmissionsCsv(formId, submissionId);
    expect(scope.isDone()).to.equal(true);
  });

  it('throws before any request when an id is not a UUID', async function () {
    const service = formService({ apiKey, baseURL });
    await expect(service.exportSubmissionsCsv('..')).to.be.rejectedWith(/formId must be a UUID/);
    await expect(service.exportSubmissionsCsv(formId, '../secret')).to.be.rejectedWith(
      /submissionId must be a UUID/,
    );
  });

  it('propagates the request error without leaking the Authorization header', async function () {
    nock(baseURL)
      .get('/api/forms/' + formId + '/submissions/submission-csv')
      .reply(404, 'Not found', { 'Content-Type': 'text/plain' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.exportSubmissionsCsv(formId);
    } catch (error) {
      caught = error;
    }

    expect(caught, 'expected exportSubmissionsCsv to reject').to.not.equal(undefined);
    expect(caught.response.status).to.equal(404);
    expect(caught.config.headers).to.not.have.property('Authorization');
    expect(JSON.stringify(caught)).to.not.contain(apiKey);
  });
});
