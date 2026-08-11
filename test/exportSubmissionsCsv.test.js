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

const validCsvResponse = 'Created At,First Name,Last Name\n2024-06-01T08:00:00Z,Jane,Smith\n';

describe('formService.exportSubmissionsCsv', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can export all submissions as CSV', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validCsvResponse });
    });

    const service = formService({ apiKey: apiKey });
    const response = await service.exportSubmissionsCsv(formId);
    expect(response).to.equal(validCsvResponse);
  });

  it('sends the Authorization header, text responseType, and the collection url', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: validCsvResponse });
    });

    const service = formService({ apiKey: apiKey });
    await service.exportSubmissionsCsv(formId);

    const createConfig = axiosStub.getCall(0).args[0];
    expect(createConfig.headers.Authorization).to.equal('Bearer test-scoped-api-key');
    expect(createConfig.responseType).to.equal('text');
    expect(capturedConfig.url).to.equal(`/api/forms/${formId}/submissions/submission-csv`);
  });

  it('appends the submissionId to the url when provided', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: validCsvResponse });
    });

    const service = formService({ apiKey: apiKey });
    await service.exportSubmissionsCsv(formId, submissionId);
    expect(capturedConfig.url).to.equal(
      `/api/forms/${formId}/submissions/submission-csv/${submissionId}`,
    );
  });

  it('throws an error if formId is not provided', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validCsvResponse });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.exportSubmissionsCsv()).to.be.rejectedWith('formId is required');
  });

  it('throws an error if no apiKey was configured', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validCsvResponse });
    });

    const savedEnvKey = process.env.FORMS_API_KEY;
    delete process.env.FORMS_API_KEY;

    try {
      const service = formService();
      await expect(service.exportSubmissionsCsv(formId)).to.be.rejectedWith(
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
    await expect(service.exportSubmissionsCsv(formId)).to.be.rejectedWith(errorMessage);
  });

  it('throws the response if a non-string response is returned', async function () {
    const unexpectedResponse = { this: 'is not what we expected' };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: unexpectedResponse });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.exportSubmissionsCsv(formId)).to.be.rejected;
  });
});
