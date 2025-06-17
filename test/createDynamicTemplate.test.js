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

describe('emailService.createDynamicTemplate', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can create a dynamic template by passing in a string of content', async function () {
    const templateName = 'template_name';
    const templateContent = '<html><body><h1>Hello {{firstName}}!</h1></body></html>';

    const validResponse = {
      message: 'Template template_name created!',
      params: {
        name: 'template_name',
        body: {
          tempfile: '#<File:0x00007ff371046a70>',
          original_filename: 'template_name.hbs',
          content_type: 'text/x-handlebars-template',
          headers:
            'Content-Disposition: form-data; name="data[body]"; filename="template_name.hbs"\r\nContent-Type: text/x-handlebars-template\r\n',
        },
      },
    };

    let capturedConfig;
    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.createDynamicTemplate(templateName, templateContent);

    expect(response).to.deep.equal(validResponse);
    expect(capturedConfig.method).to.equal('POST');
    expect(capturedConfig.url).to.equal('/dynamic_templates');
    expect(capturedConfig.headers['content-type']).to.include('multipart/form-data; boundary=');
  });

  it('can create a dynamic template by passing in a streamed file', async function () {
    const templateName = 'template_name';
    const stream = fs.createReadStream('test/fixtures/template.hbs');

    const validResponse = {
      message: 'Template template_name created!',
      params: {
        name: 'template_name',
        body: {
          tempfile: '#<File:0x00007ff371046a70>',
          original_filename: 'template.hbs',
          content_type: 'text/x-handlebars-template',
          headers:
            'Content-Disposition: form-data; name="data[body]"; filename="template.hbs"\r\nContent-Type: text/x-handlebars-template\r\n',
        },
      },
    };

    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.createDynamicTemplate(templateName, stream);

    expect(response).to.deep.equal(validResponse);
    expect(capturedConfig.method).to.equal('POST');
    expect(capturedConfig.url).to.equal('/dynamic_templates');
    expect(capturedConfig.headers['content-type']).to.include('multipart/form-data; boundary=');
  });

  it('can create a dynamic template by passing in a Buffer', async function () {
    const templateName = 'template_name';
    const buffer = Buffer.from('<html><body><h1>Hello {{firstName}}!</h1></body></html>');

    const validResponse = {
      message: 'Template template_name created!',
      params: {
        name: 'template_name',
        body: {
          tempfile: '#<File:0x00007ff371046a70>',
          original_filename: 'template.hbs',
          content_type: 'text/x-handlebars-template',
          headers:
            'Content-Disposition: form-data; name="data[body]"; filename="template.hbs"\r\nContent-Type: text/x-handlebars-template\r\n',
        },
      },
    };

    let capturedConfig;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.createDynamicTemplate(templateName, buffer);

    expect(response).to.deep.equal(validResponse);
    expect(capturedConfig.method).to.equal('POST');
    expect(capturedConfig.url).to.equal('/dynamic_templates');
    expect(capturedConfig.headers['content-type']).to.include('multipart/form-data; boundary=');
  });

  it('can respond to server errors', async function () {
    const templateName = 'template_name';
    const templateContent = '<html><body><h1>Hello {{firstName}}!</h1></body></html>';
    const errorResponse = {
      error: 'Template body is invalid.',
    };

    let capturedConfig;
    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: errorResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.createDynamicTemplate(templateName, templateContent);

    expect(response).to.deep.equal(errorResponse);
    expect(capturedConfig.method).to.equal('POST');
    expect(capturedConfig.url).to.equal('/dynamic_templates');
    expect(capturedConfig.headers['content-type']).to.include('multipart/form-data; boundary=');
  });

  it('raises the API response as an error if no data is returned from the Paubox API', async function () {
    const templateName = 'template_name';
    const templateContent = '<html><body><h1>Hello {{firstName}}!</h1></body></html>';
    const emptyResponse = {};

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: emptyResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.createDynamicTemplate(templateName, templateContent)).to.be.rejectedWith(
      emptyResponse,
    );
  });
});
