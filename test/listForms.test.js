const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';

const validListResponse = {
  results: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Patient Intake Form',
      active: true,
      archived: false,
      submission_count: 42,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      title: 'Consent Form',
      active: false,
      archived: true,
      submission_count: 7,
    },
  ],
  page_info: { count: 2, pages: 1, page: 1, items: 50 },
};

describe('formService.listForms', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can list forms', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validListResponse });
    });

    const service = formService({ apiKey: apiKey });
    const response = await service.listForms();
    expect(response).to.deep.equal(validListResponse);
  });

  it('sends an Authorization header with the api key', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validListResponse });
    });

    const service = formService({ apiKey: apiKey });
    await service.listForms();

    const createConfig = axiosStub.firstCall.args[0];
    expect(createConfig.headers.Authorization).to.equal('Bearer ' + apiKey);
    expect(createConfig.baseURL).to.equal('https://apx.paubox.com/forms');
  });

  it('sends only the provided query params', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: validListResponse });
    });

    const service = formService({ apiKey: apiKey });
    await service.listForms({
      search: 'intake',
      order: 'asc',
      order_by: 'title',
      archived: false,
      page: 2,
      items: 25,
      unknown_param: 'should not be sent',
    });

    expect(capturedConfig.method).to.equal('GET');
    expect(capturedConfig.url).to.equal('/api/forms');
    expect(capturedConfig.params).to.deep.equal({
      search: 'intake',
      order: 'asc',
      order_by: 'title',
      archived: false,
      page: 2,
      items: 25,
    });
  });

  it('sends no query params when none are provided', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: validListResponse });
    });

    const service = formService({ apiKey: apiKey });
    await service.listForms();

    expect(capturedConfig.params).to.deep.equal({});
  });

  it('omits params that are null', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: validListResponse });
    });

    const service = formService({ apiKey: apiKey });
    await service.listForms({ search: null, page: 1 });

    expect(capturedConfig.params).to.deep.equal({ page: 1 });
  });

  it('throws an error if no apiKey was configured', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validListResponse });
    });

    const savedEnvKey = process.env.FORMS_API_KEY;
    delete process.env.FORMS_API_KEY;

    try {
      const service = formService();
      await expect(service.listForms()).to.be.rejectedWith(
        'apiKey is required for this method. Pass { apiKey } to formService() or set the FORMS_API_KEY environment variable.',
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
    await expect(service.listForms()).to.be.rejectedWith(errorMessage);
  });

  it('throws the response if an unexpected response is returned', async function () {
    const unexpectedResponse = { this: 'is not what we expected' };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: unexpectedResponse });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.listForms()).to.be.rejected.and.eventually.deep.equal(unexpectedResponse);
  });
});
