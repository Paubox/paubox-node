const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const formId = '550e8400-e29b-41d4-a716-446655440000';
const submissionId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

const validPdfResponse = Buffer.from('%PDF-1.4 fake pdf content');

describe('formService.exportSubmissionPdf', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can export a submission as a PDF', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validPdfResponse });
    });

    const service = formService({ apiKey: apiKey });
    const response = await service.exportSubmissionPdf(formId, submissionId);
    expect(response).to.equal(validPdfResponse);
  });

  it('sends the Authorization header, arraybuffer responseType, and the submission url', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: validPdfResponse });
    });

    const service = formService({ apiKey: apiKey });
    await service.exportSubmissionPdf(formId, submissionId);

    const createConfig = axiosStub.getCall(0).args[0];
    expect(createConfig.headers.Authorization).to.equal('Bearer test-scoped-api-key');
    expect(createConfig.responseType).to.equal('arraybuffer');
    expect(capturedConfig.url).to.equal(
      `/api/forms/${formId}/submissions/${submissionId}/submission-pdf`,
    );
  });

  it('throws an error if formId is not provided', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validPdfResponse });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.exportSubmissionPdf(null, submissionId)).to.be.rejectedWith(
      'formId is required',
    );
  });

  it('throws an error if submissionId is not provided', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validPdfResponse });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.exportSubmissionPdf(formId)).to.be.rejectedWith(
      'submissionId is required',
    );
  });

  it('throws an error if no apiKey was configured', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validPdfResponse });
    });

    const savedEnvKey = process.env.FORMS_API_KEY;
    delete process.env.FORMS_API_KEY;

    try {
      const service = formService();
      await expect(service.exportSubmissionPdf(formId, submissionId)).to.be.rejectedWith(
        'apiKey is required for this method',
      );
    } finally {
      if (savedEnvKey !== undefined) {
        process.env.FORMS_API_KEY = savedEnvKey;
      }
    }
  });

  it('throws the response if the request fails', async function () {
    const errorMessage = 'Request failed with status code 404';

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.reject({ message: errorMessage, response: { status: 404 } });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.exportSubmissionPdf(formId, submissionId)).to.be.rejectedWith(
      errorMessage,
    );
  });

  it('throws if the response body is null', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: null });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.exportSubmissionPdf(formId, submissionId)).to.be.rejected;
  });
});
