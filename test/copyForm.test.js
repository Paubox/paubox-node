const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const formId = '550e8400-e29b-41d4-a716-446655440000';
const newTitle = 'Patient Intake Form (Copy)';
const apiKey = 'test-scoped-api-key';

const copiedFormResponse = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  title: newTitle,
  description: 'Please complete before your appointment.',
  form_json: {},
  form_html: '<form>...</form>',
  form_css: 'form { font-family: sans-serif; }',
  vanity_url: null,
  version: 1,
  active: true,
  customer_id: 123,
  signable: false,
  signature_confirmation_label: null,
  submission_count: 0,
  type: null,
  deleted: false,
  archived: false,
  created_at: '2026-08-11T10:30:00Z',
  updated_at: '2026-08-11T10:30:00Z',
};

describe('formService.copyForm', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can copy a form', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: copiedFormResponse });
    });

    const service = formService({ apiKey: apiKey });
    const response = await service.copyForm(formId, newTitle);
    expect(response).to.deep.equal(copiedFormResponse);
  });

  it('sends a Bearer Authorization header and the documented body', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: copiedFormResponse });
    });

    const service = formService({ apiKey: apiKey });
    await service.copyForm(formId, newTitle);

    const createConfig = axiosStub.firstCall.args[0];
    expect(createConfig.headers.Authorization).to.equal('Bearer ' + apiKey);
    expect(capturedConfig.method).to.equal('POST');
    expect(capturedConfig.url).to.equal('/api/forms/copy');
    expect(capturedConfig.data).to.deep.equal({ form_id: formId, title: newTitle });
  });

  it('throws an error if formId is not provided', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: copiedFormResponse });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.copyForm(null, newTitle)).to.be.rejectedWith('formId is required');
  });

  it('throws an error if title is not provided', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: copiedFormResponse });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.copyForm(formId)).to.be.rejectedWith('title is required');
  });

  it('throws an error if no apiKey was configured', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: copiedFormResponse });
    });

    const savedApiKey = process.env.FORMS_API_KEY;
    delete process.env.FORMS_API_KEY;
    try {
      const service = formService();
      await expect(service.copyForm(formId, newTitle)).to.be.rejectedWith(
        'apiKey is required for this method',
      );
    } finally {
      if (savedApiKey !== undefined) {
        process.env.FORMS_API_KEY = savedApiKey;
      }
    }
  });

  it('throws the response if the form is not found', async function () {
    const errorMessage = 'Request failed with status code 404';

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.reject({ message: errorMessage, response: { status: 404 } });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.copyForm(formId, newTitle)).to.be.rejectedWith(errorMessage);
  });

  it('throws the response if an unexpected response is returned', async function () {
    const unexpectedResponse = { this: 'is not what we expected' };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: unexpectedResponse });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.copyForm(formId, newTitle)).to.be.rejected.then((thrown) => {
      expect(thrown).to.deep.equal(unexpectedResponse);
    });
  });
});
