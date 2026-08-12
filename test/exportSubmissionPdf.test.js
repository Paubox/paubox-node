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

// Minimal PDF byte stream (starts with the %PDF magic number).
const pdfBytes = Buffer.from('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n', 'binary');

describe('formService.exportSubmissionPdf', function () {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('can export a submission as a PDF', async function () {
    nock(baseURL)
      .get('/api/forms/' + formId + '/submissions/' + submissionId + '/submission-pdf')
      .reply(200, pdfBytes, { 'Content-Type': 'application/pdf' });

    const service = formService({ apiKey, baseURL });
    const response = await service.exportSubmissionPdf(formId, submissionId);
    const buf = Buffer.from(response);
    expect(buf.slice(0, 4).toString('ascii')).to.equal('%PDF');
  });

  it('sends the Bearer Authorization header, arraybuffer responseType, and the submission url', async function () {
    const scope = nock(baseURL, {
      reqheaders: { authorization: 'Bearer ' + apiKey },
    })
      .get('/api/forms/' + formId + '/submissions/' + submissionId + '/submission-pdf')
      .reply(200, pdfBytes, { 'Content-Type': 'application/pdf' });

    const service = formService({ apiKey, baseURL });
    await service.exportSubmissionPdf(formId, submissionId);
    expect(scope.isDone()).to.equal(true);
  });

  it('throws before any request when an id is not a UUID', async function () {
    const service = formService({ apiKey, baseURL });
    await expect(service.exportSubmissionPdf('..', submissionId)).to.be.rejectedWith(
      /formId must be a UUID/,
    );
    await expect(service.exportSubmissionPdf(formId, '..')).to.be.rejectedWith(
      /submissionId must be a UUID/,
    );
    await expect(service.exportSubmissionPdf(formId, undefined)).to.be.rejectedWith(
      /submissionId is required/,
    );
  });

  it('propagates the request error without leaking the Authorization header', async function () {
    nock(baseURL)
      .get('/api/forms/' + formId + '/submissions/' + submissionId + '/submission-pdf')
      .reply(404, 'Not found', { 'Content-Type': 'text/plain' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.exportSubmissionPdf(formId, submissionId);
    } catch (error) {
      caught = error;
    }

    expect(caught, 'expected exportSubmissionPdf to reject').to.not.equal(undefined);
    expect(caught.response.status).to.equal(404);
    expect(caught.config.headers).to.not.have.property('Authorization');
    expect(JSON.stringify(caught)).to.not.contain(apiKey);
  });
});
