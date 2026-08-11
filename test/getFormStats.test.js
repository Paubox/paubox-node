const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';

const validStatsResponse = {
  active_form_count: 12,
  total_submission_count: 340,
  submissions_last_7_days: 27,
};

describe('formService.getFormStats', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can get form stats', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validStatsResponse });
    });

    const service = formService({ apiKey: apiKey });
    const response = await service.getFormStats();
    expect(response).to.deep.equal(validStatsResponse);
  });

  it('sends a Bearer Authorization header and no customer_id when omitted', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: validStatsResponse });
    });

    const service = formService({ apiKey: apiKey });
    await service.getFormStats();

    const createConfig = axiosStub.firstCall.args[0];
    expect(createConfig.headers.Authorization).to.equal('Bearer ' + apiKey);
    expect(capturedConfig.method).to.equal('GET');
    expect(capturedConfig.url).to.equal('/api/forms/stats');
    expect(capturedConfig.params).to.deep.equal({});
  });

  it('sends the customer_id query param when provided', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: validStatsResponse });
    });

    const service = formService({ apiKey: apiKey });
    await service.getFormStats(123);

    expect(capturedConfig.url).to.equal('/api/forms/stats');
    expect(capturedConfig.params).to.deep.equal({ customer_id: 123 });
  });

  it('throws an error if no apiKey was configured', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validStatsResponse });
    });

    const savedApiKey = process.env.FORMS_API_KEY;
    delete process.env.FORMS_API_KEY;
    try {
      const service = formService();
      await expect(service.getFormStats()).to.be.rejectedWith('apiKey is required for this method');
    } finally {
      if (savedApiKey !== undefined) {
        process.env.FORMS_API_KEY = savedApiKey;
      }
    }
  });

  it('throws the response if the request fails', async function () {
    const errorMessage = 'Request failed with status code 401';

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.reject({ message: errorMessage, response: { status: 401 } });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.getFormStats()).to.be.rejectedWith(errorMessage);
  });

  it('throws the response if an unexpected response is returned', async function () {
    const unexpectedResponse = { this: 'is not what we expected' };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: unexpectedResponse });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.getFormStats()).to.be.rejected.then((thrown) => {
      expect(thrown).to.deep.equal(unexpectedResponse);
    });
  });
});
