const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const formId = '550e8400-e29b-41d4-a716-446655440000';

const validListResponse = {
  data: [
    {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      form_id: formId,
      form_data: '{"first_name":"Jane","last_name":"Smith"}',
      storage_type: null,
      storage_url: null,
      submitter_email: 'jane@example.com',
      recipients: 'clinic@example.com',
      attachment_name: null,
      attachment_url: null,
      attachment_type: null,
      attachment: null,
      created_at: '2024-06-01T08:00:00Z',
    },
  ],
  total: 1,
  page: 1,
  items: 50,
};

describe('formService.listSubmissions', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can list submissions', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validListResponse });
    });

    const service = formService({ apiKey: apiKey });
    const response = await service.listSubmissions(formId);
    expect(response).to.deep.equal(validListResponse);
  });

  it('sends the Authorization header and only the provided query params', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: validListResponse });
    });

    const service = formService({ apiKey: apiKey });
    await service.listSubmissions(formId, { order: 'asc', page: 2, items: 25 });

    const createConfig = axiosStub.getCall(0).args[0];
    expect(createConfig.headers.Authorization).to.equal('Bearer test-scoped-api-key');
    expect(capturedConfig.url).to.equal(`/api/forms/${formId}/submissions`);
    expect(capturedConfig.params).to.deep.equal({ order: 'asc', page: 2, items: 25 });
  });

  it('sends no query params when none are provided', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: validListResponse });
    });

    const service = formService({ apiKey: apiKey });
    await service.listSubmissions(formId);
    expect(capturedConfig.params).to.deep.equal({});
  });

  it('throws an error if formId is not provided', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validListResponse });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.listSubmissions()).to.be.rejectedWith('formId is required');
  });

  it('throws an error if no apiKey was configured', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validListResponse });
    });

    const savedEnvKey = process.env.FORMS_API_KEY;
    delete process.env.FORMS_API_KEY;

    try {
      const service = formService();
      await expect(service.listSubmissions(formId)).to.be.rejectedWith(
        'apiKey is required for this method',
      );
    } finally {
      if (savedEnvKey !== undefined) {
        process.env.FORMS_API_KEY = savedEnvKey;
      }
    }
  });

  it('throws the response if the request fails', async function () {
    const errorMessage = 'Request failed with status code 401';

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.reject({ message: errorMessage, response: { status: 401 } });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.listSubmissions(formId)).to.be.rejectedWith(errorMessage);
  });

  it('throws the response if an unexpected response is returned', async function () {
    const unexpectedResponse = { this: 'is not what we expected' };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: unexpectedResponse });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.listSubmissions(formId)).to.be.rejected;
  });
});
