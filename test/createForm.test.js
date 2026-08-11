const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const newFormId = '770e8400-e29b-41d4-a716-446655440002';

const validFormAttributes = {
  title: 'Patient Intake Form',
  form_json: { fields: [{ label: 'First Name', type: 'text' }] },
  customer_id: 123,
  version: 1,
};

describe('formService.createForm', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can create a form', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: { id: newFormId } });
    });

    const service = formService({ apiKey: apiKey });
    const response = await service.createForm(validFormAttributes);
    expect(response).to.deep.equal({ id: newFormId });
  });

  it('sends an Authorization header and posts to the right url', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: { id: newFormId } });
    });

    const service = formService({ apiKey: apiKey });
    await service.createForm(validFormAttributes);

    const createConfig = axiosStub.firstCall.args[0];
    expect(createConfig.headers.Authorization).to.equal('Bearer ' + apiKey);
    expect(capturedConfig.method).to.equal('POST');
    expect(capturedConfig.url).to.equal('/api/forms');
  });

  it('sends only the provided fields', async function () {
    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({ data: { id: newFormId } });
    });

    const service = formService({ apiKey: apiKey });
    await service.createForm({
      ...validFormAttributes,
      description: 'Please complete before your appointment.',
      active: true,
      not_an_allowed_field: 'should not be sent',
    });

    expect(capturedConfig.data).to.deep.equal({
      title: validFormAttributes.title,
      form_json: validFormAttributes.form_json,
      customer_id: validFormAttributes.customer_id,
      version: validFormAttributes.version,
      description: 'Please complete before your appointment.',
      active: true,
    });
  });

  it('throws an error if formAttributes is not provided', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: { id: newFormId } });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.createForm()).to.be.rejectedWith(
      'formAttributes is required and must be an object',
    );
  });

  it('throws an error if formAttributes is not an object', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: { id: newFormId } });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.createForm('not an object')).to.be.rejectedWith(
      'formAttributes is required and must be an object',
    );
  });

  it('throws an error if formAttributes is an array', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: { id: newFormId } });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.createForm(['title'])).to.be.rejectedWith(
      'formAttributes is required and must be an object',
    );
  });

  ['title', 'form_json', 'customer_id', 'version'].forEach((field) => {
    it(`throws an error if ${field} is missing`, async function () {
      axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
        return Promise.resolve({ data: { id: newFormId } });
      });

      const attributes = { ...validFormAttributes };
      delete attributes[field];

      const service = formService({ apiKey: apiKey });
      await expect(service.createForm(attributes)).to.be.rejectedWith(`${field} is required`);
    });
  });

  it('throws an error if no apiKey was configured', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: { id: newFormId } });
    });

    const savedEnvKey = process.env.FORMS_API_KEY;
    delete process.env.FORMS_API_KEY;

    try {
      const service = formService();
      await expect(service.createForm(validFormAttributes)).to.be.rejectedWith(
        'apiKey is required for this method. Pass { apiKey } to formService() or set the FORMS_API_KEY environment variable.',
      );
    } finally {
      if (savedEnvKey !== undefined) {
        process.env.FORMS_API_KEY = savedEnvKey;
      }
    }
  });

  it('throws the response if the request fails', async function () {
    const errorMessage = 'Request failed with status code 422';

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.reject({ message: errorMessage, response: { status: 422 } });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.createForm(validFormAttributes)).to.be.rejectedWith(errorMessage);
  });

  it('throws the response if an unexpected response is returned', async function () {
    const unexpectedResponse = { this: 'is not what we expected' };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({ data: unexpectedResponse });
    });

    const service = formService({ apiKey: apiKey });
    await expect(service.createForm(validFormAttributes)).to.be.rejected.and.eventually.deep.equal(
      unexpectedResponse,
    );
  });
});
