const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const formId = '550e8400-e29b-41d4-a716-446655440000';

const validFormResponse = {
  id: formId,
  title: 'Patient Intake Form',
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
  submission_count: 42,
  type: null,
  deleted: false,
  archived: false,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-06-01T08:00:00Z',
};

describe('formService.getForm', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can get a form', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validFormResponse });
    });

    const service = formService();
    const response = await service.getForm(formId);
    expect(response).to.deep.equal(validFormResponse);
  });

  it('throws an error if formId is not provided', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: validFormResponse });
    });

    const service = formService();
    await expect(service.getForm()).to.be.rejectedWith('formId is required');
  });

  it('throws the response if form is not found', async function () {
    const errorMessage = 'Request failed with status code 404';

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.reject({ message: errorMessage, response: { status: 404 } });
    });

    const service = formService();
    await expect(service.getForm(formId)).to.be.rejectedWith(errorMessage);
  });

  it('throws the response if an unexpected response is returned', async function () {
    const unexpectedResponse = { this: 'is not what we expected' };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: unexpectedResponse });
    });

    const service = formService();
    await expect(service.getForm(formId)).to.be.rejected;
  });
});
