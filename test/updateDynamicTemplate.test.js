const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');
const fs = require('fs');

const emailService = require('../src/service/emailService.js');

chai.use(chaiAsPromised);

const testCredentials = {
  apiUsername: 'authorized_domain',
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
      message: "Template new_name updated!",
      params: {
        name: "new_name",
        body: {
          tempfile: "#<File:0x00007f61b560e028>",
          original_filename: "new_file.hbs",
          content_type: "text/x-handlebars-template",
          headers: "Content-Disposition: form-data; name=\"data[body]\"; filename=\"new_file.hbs\"\r\nContent-Type: text/x-handlebars-template\r\n"
        }
      }
    }

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

  it('can update a dynamic template\'s name only', async function () {
    const templateId = 123;
    const newName = 'Another New Name';

    const validResponse = {
      message: "Template Another New Name updated!",
      params: {
        name: "Another New Name"
      }
    }

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

  it('can update a dynamic template\'s file only', async function () {
    const templateId = 123;
    const newFile = Buffer.from('<html><body><h1>Bye {{firstName}}!</h1></body></html>');

    const validResponse = {
      message: "Template  updated!",
      params: {
        body: {
          tempfile: "#<File:0x00007f61b9b12d90>",
          original_filename: "new_file.hbs",
          content_type: "text/x-handlebars-template",
          headers: "Content-Disposition: form-data; name=\"data[body]\"; filename=\"new_file.hbs\"\r\nContent-Type: text/x-handlebars-template\r\n"
        }
      }
    }

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
      error: "param is missing or the value is empty"
    }

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: errorResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.updateDynamicTemplate(templateId, newName, newFile)).to.be.rejectedWith(errorResponse);
  });

  it('raises the API response as an error if no data is returned from the Paubox API', async function () {
    const templateId = 123;
    const newName = 'new_name';
    const newFile = Buffer.from('<html><body><h1>Bye {{firstName}}!</h1></body></html>');

    const emptyResponse = {}

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: emptyResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.updateDynamicTemplate(templateId, newName, newFile)).to.be.rejectedWith(emptyResponse);
  });
});
