const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const formId = '550e8400-e29b-41d4-a716-446655440000';

const validForm = {
  id: formId,
  title: 'Patient Intake Form',
  description: 'Please complete before your appointment.',
  form_json: {},
  form_html: '<form>...</form>',
  form_css: 'form { font-family: sans-serif; }',
  vanity_url: null,
  version: 1,
  active: false,
  customer_id: 123,
  signable: false,
  signature_confirmation_label: null,
  submission_count: 42,
  type: null,
  deleted: false,
  archived: true,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-06-01T08:00:00Z',
};

describe('formService.getFormById', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can get a form by id, including archived and inactive forms', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: { data: validForm } });
    });

    const service = formService({ apiKey: apiKey });
    const response = await service.getFormById(formId);
    expect(response).to.deep.equal(validForm);
  });

  it('sends an Authorization header and requests the right url', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: { data: validForm } });
    });

    const service = formService({ apiKey: apiKey });
    await service.getFormById(formId);

    const createConfig = axiosStub.firstCall.args[0];
    expect(createConfig.headers.Authorization).to.equal('Bearer ' + apiKey);
    expect(capturedConfig.method).to.equal('GET');
    expect(capturedConfig.url).to.equal(`/api/forms/${formId}`);
  });

  it('throws an error if formId is not provided', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: { data: validForm } });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.getFormById()).to.be.rejectedWith('formId is required');
  });

  it('throws an error if no apiKey was configured', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: { data: validForm } });
    });

    const savedEnvKey = process.env.FORMS_API_KEY;
    delete process.env.FORMS_API_KEY;

    try {
      const service = formService();
      await expect(service.getFormById(formId)).to.be.rejectedWith(
        'apiKey is required for this method. Pass { apiKey } to formService() or set the FORMS_API_KEY environment variable.',
      );
    } finally {
      if (savedEnvKey !== undefined) {
        process.env.FORMS_API_KEY = savedEnvKey;
      }
    }
  });

  it('throws the response if the form is not found', async function () {
    const errorMessage = 'Request failed with status code 404';

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.reject({ message: errorMessage, response: { status: 404 } });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.getFormById(formId)).to.be.rejectedWith(errorMessage);
  });

  it('throws the response if an unexpected response is returned', async function () {
    const unexpectedResponse = { this: 'is not what we expected' };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: unexpectedResponse });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.getFormById(formId)).to.be.rejected.and.eventually.deep.equal(
      unexpectedResponse,
    );
  });

  it('throws the response if the wrapped form has no id', async function () {
    const responseWithoutId = { data: { title: 'No id here' } };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: responseWithoutId });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.getFormById(formId)).to.be.rejected.and.eventually.deep.equal(
      responseWithoutId,
    );
  });
});
