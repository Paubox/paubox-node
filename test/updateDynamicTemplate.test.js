const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const emailService = require('../src/service/emailService.js');

chai.use(chaiAsPromised);

const testCredentials = {
  apiKey: 'api-key-12345',
};

describe('emailService.updateDynamicTemplate', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can update a dynamic template with both a new name and a new file', async function () {
    const templateId = 123;
    const newName = 'new_name';
    const newFile = Buffer.from('<html><body><h1>Bye {{firstName}}!</h1></body></html>');

    const validResponse = {
      id: 123,
      api_customer_id: 12,
      name: 'new_name',
      body: '<html><body><h1>Bye {{firstName}}!</h1></body></html>',
      metadata: null,
      created_at: '2026-10-13T17:02:11.123Z',
      updated_at: '2026-10-13T17:02:11.123Z',
    };

    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.updateDynamicTemplate(templateId, newName, newFile);

    expect(response).to.deep.equal(validResponse);
    expect(capturedConfig.method).to.equal('PATCH');
    expect(capturedConfig.url).to.equal(`/dynamic_templates/${templateId}`);
    expect(capturedConfig.headers['content-type']).to.include('multipart/form-data; boundary=');
  });

  it("can update a dynamic template's name only", async function () {
    const templateId = 123;
    const newName = 'Another New Name';

    const validResponse = {
      id: 123,
      api_customer_id: 12,
      name: 'Another New Name',
      body: '<html><body><h1>Hello {{firstName}}!</h1></body></html>',
      metadata: null,
      created_at: '2026-10-13T17:02:11.123Z',
      updated_at: '2026-10-13T17:02:11.123Z',
    };

    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.updateDynamicTemplate(templateId, newName);

    expect(response).to.deep.equal(validResponse);
    expect(capturedConfig.method).to.equal('PATCH');
    expect(capturedConfig.url).to.equal(`/dynamic_templates/${templateId}`);
    expect(capturedConfig.headers['content-type']).to.include('multipart/form-data; boundary=');
  });

  it("can update a dynamic template's file only", async function () {
    const templateId = 123;
    const newFile = Buffer.from('<html><body><h1>Bye {{firstName}}!</h1></body></html>');

    const validResponse = {
      id: 123,
      api_customer_id: 12,
      name: 'template_name',
      body: '<html><body><h1>Bye {{firstName}}!</h1></body></html>',
      metadata: null,
      created_at: '2026-10-13T17:02:11.123Z',
      updated_at: '2026-10-13T17:02:11.123Z',
    };

    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.updateDynamicTemplate(templateId, null, newFile);

    expect(response).to.deep.equal(validResponse);
    expect(capturedConfig.method).to.equal('PATCH');
    expect(capturedConfig.url).to.equal(`/dynamic_templates/${templateId}`);
    expect(capturedConfig.headers['content-type']).to.include('multipart/form-data; boundary=');
  });

  it('raises an error if no name or file is provided', async function () {
    const templateId = 123;

    const service = emailService(testCredentials);
    await expect(service.updateDynamicTemplate(templateId)).to.be.rejectedWith(Error);
  });

  it('raises an error if an error response is returned', async function () {
    const templateId = 123;
    const newName = 'new_name';
    const newFile = Buffer.from('<html><body><h1>Bye {{firstName}}!</h1></body></html>');

    const errorResponse = {
      error: 'param is missing or the value is empty',
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: errorResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.updateDynamicTemplate(templateId, newName, newFile)).to.be.rejectedWith(
      errorResponse,
    );
  });

  it('raises an error if a 500 error is returned', async function () {
    const templateId = 123;
    const newName = 'new_name';
    const newFile = Buffer.from('<html><body><h1>Bye {{firstName}}!</h1></body></html>');

    const errorMessage = "Couldn't find DynamicTemplate with 'id'=123";

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.reject({
        message: errorMessage,
        response: {
          status: 500,
        },
      });
    });

    const service = emailService(testCredentials);
    await expect(service.updateDynamicTemplate(templateId, newName, newFile)).to.be.rejectedWith(
      errorMessage,
    );
  });

  it('raises the API response as an error if no data is returned from the Paubox API', async function () {
    const templateId = 123;
    const newName = 'new_name';
    const newFile = Buffer.from('<html><body><h1>Bye {{firstName}}!</h1></body></html>');

    const emptyResponse = {};

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: emptyResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.updateDynamicTemplate(templateId, newName, newFile)).to.be.rejectedWith(
      emptyResponse,
    );
  });
});
