const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const formId = '550e8400-e29b-41d4-a716-446655440000';

describe('formService.submitForm', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can submit a form with text fields', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: null });
    });

    const service = formService();
    const formData = { first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' };
    const response = await service.submitForm(formId, formData);
    expect(response).to.be.null;
  });

  it('can submit a form with attachments', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: null });
    });

    const service = formService();
    const formData = { first_name: 'Jane' };
    const attachments = [{ name: 'consent.pdf', content: 'JVBERi0xLjQ...' }];
    const response = await service.submitForm(formId, formData, attachments);
    expect(response).to.be.null;
  });

  it('throws an error if formId is not provided', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: null });
    });

    const service = formService();
    await expect(service.submitForm(null, { first_name: 'Jane' })).to.be.rejectedWith(
      'formId is required',
    );
  });

  it('throws an error if formData is not provided', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: null });
    });

    const service = formService();
    await expect(service.submitForm(formId)).to.be.rejectedWith(
      'formData is required and must be an object',
    );
  });

  it('throws an error if formData is not an object', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: null });
    });

    const service = formService();
    await expect(service.submitForm(formId, 'not an object')).to.be.rejectedWith(
      'formData is required and must be an object',
    );
  });

  it('throws an error if formData is an array', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: null });
    });

    const service = formService();
    await expect(service.submitForm(formId, ['field1', 'field2'])).to.be.rejectedWith(
      'formData is required and must be an object',
    );
  });

  it('throws the response if the form is not found', async function () {
    const errorMessage = 'Request failed with status code 404';

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.reject({ message: errorMessage, response: { status: 404 } });
    });

    const service = formService();
    await expect(service.submitForm(formId, { first_name: 'Jane' })).to.be.rejectedWith(
      errorMessage,
    );
  });

  it('ignores an empty attachments array', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: null });
    });

    const service = formService();
    const response = await service.submitForm(formId, { first_name: 'Jane' }, []);
    expect(response).to.be.null;
    expect(capturedConfig).to.not.have.nested.property('data.attachments');
  });
});
