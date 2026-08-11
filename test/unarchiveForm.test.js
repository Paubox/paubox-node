const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const formId = '550e8400-e29b-41d4-a716-446655440000';
const apiKey = 'test-scoped-api-key';

const validUnarchiveResponse = { detail: 'Form unarchived.' };

describe('formService.unarchiveForm', function () {
  let axiosStub;
  let savedFormsApiKey;

  this.beforeEach(() => {
    savedFormsApiKey = process.env.FORMS_API_KEY;
    delete process.env.FORMS_API_KEY;
  });

  this.afterEach(() => {
    if (savedFormsApiKey !== undefined) {
      process.env.FORMS_API_KEY = savedFormsApiKey;
    } else {
      delete process.env.FORMS_API_KEY;
    }
    if (axiosStub) {
      axiosStub.restore();
      axiosStub = undefined;
    }
  });

  it('can unarchive a form', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validUnarchiveResponse });
    });

    const service = formService({ apiKey });
    const response = await service.unarchiveForm(formId);
    expect(response).to.deep.equal(validUnarchiveResponse);
  });

  it('sends a Bearer Authorization header and POSTs to the unarchive endpoint', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: validUnarchiveResponse });
    });

    const service = formService({ apiKey });
    await service.unarchiveForm(formId);

    const createConfig = axiosStub.getCall(0).args[0];
    expect(createConfig.headers.Authorization).to.equal('Bearer test-scoped-api-key');
    expect(createConfig.baseURL).to.equal('https://apx.paubox.com/forms');

    expect(capturedConfig.method).to.equal('POST');
    expect(capturedConfig.url).to.equal(`/api/forms/${formId}/unarchive`);
    expect(capturedConfig.data).to.be.undefined;
  });

  it('throws an error if formId is not provided', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validUnarchiveResponse });
    });

    const service = formService({ apiKey });
    await expect(service.unarchiveForm()).to.be.rejectedWith('formId is required');
  });

  it('throws an error if no apiKey was configured', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validUnarchiveResponse });
    });

    const service = formService();
    await expect(service.unarchiveForm(formId)).to.be.rejectedWith(
      'apiKey is required for this method. Pass { apiKey } to formService() or set the FORMS_API_KEY environment variable.',
    );
  });

  it('throws the response if the request fails', async function () {
    const errorMessage = 'Request failed with status code 404';

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.reject({ message: errorMessage, response: { status: 404 } });
    });

    const service = formService({ apiKey });
    await expect(service.unarchiveForm(formId)).to.be.rejectedWith(errorMessage);
  });

  it('throws the response if an unexpected response is returned', async function () {
    const unexpectedResponse = { this: 'is not what we expected' };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: unexpectedResponse });
    });

    const service = formService({ apiKey });
    await expect(service.unarchiveForm(formId)).to.be.rejected;
  });
});
