const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const emailService = require('./emailService.js');
const Message = require('../data/message.js');

chai.use(chaiAsPromised);

const testCredentials = {
  apiUsername: 'authorized_domain',
  apiKey: 'api-key-12345',
};

describe('emailService.getEmailDisposition', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can return a successful response with no message deliveries', async function () {
    const validSourceTrackingId = '6e1cf9a4-7bde-4834-8200-ed424b50c8a7';

    const validResponse = {
      sourceTrackingId: validSourceTrackingId,
      data: {
        message: {
          id: `${validSourceTrackingId}@authorized_domain.com`,
          message_deliveries: [],
        },
      },
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.getEmailDisposition(validSourceTrackingId);
    expect(response).to.deep.equal(validResponse);
  });

  it('can return a successful response with message deliveries', async function () {
    const validSourceTrackingId = '6e1cf9a4-7bde-4834-8200-ed424b50c8a7';

    const validResponse = {
      sourceTrackingId: validSourceTrackingId,
      data: {
        message: {
          id: `${validSourceTrackingId}@authorized_domain.com`,
          message_deliveries: [
            {
              recipient: 'recipient@host.com',
              status: {
                deliveryStatus: 'delivered',
                deliveryTime: 'Mon, 23 Apr 2018 13:27:34 -0700',
                openedStatus: 'opened',
                openedTime: 'Mon, 23 Apr 2018 13:27:51 -0700',
              },
            },
          ],
        },
      },
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.getEmailDisposition(validSourceTrackingId);
    expect(response).to.deep.equal(validResponse);
  });

  it('defaults all openedStatus to unopened', async function () {
    const validSourceTrackingId = '6e1cf9a4-7bde-4834-8200-ed424b50c8a7';

    const validResponse = {
      sourceTrackingId: validSourceTrackingId,
      data: {
        message: {
          id: `${validSourceTrackingId}@authorized_domain.com`,
          message_deliveries: [
            {
              recipient: 'recipient@host.com',
              status: {
                deliveryStatus: 'delivered',
                deliveryTime: 'Mon, 23 Apr 2018 13:27:34 -0700',
                openedStatus: null, // This should be defaulted to unopened
                openedTime: null,
              },
            },
          ],
        },
      },
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.getEmailDisposition(validSourceTrackingId);

    expect(response).to.deep.equal({
      sourceTrackingId: validSourceTrackingId,
      data: {
        message: {
          id: `${validSourceTrackingId}@authorized_domain.com`,
          message_deliveries: [
            {
              recipient: 'recipient@host.com',
              status: {
                deliveryStatus: 'delivered',
                deliveryTime: 'Mon, 23 Apr 2018 13:27:34 -0700',
                openedStatus: 'unopened', // This has been changed from null to unopened
                openedTime: null,
              },
            },
          ],
        },
      },
    });
  });

  it('raises the API response as an error if no data is returned from the Paubox API', async function () {
    const sourceTrackingId = '6e1cf9a4-7bde-4834-8200-ed424b50c8a7';

    const emptyResponse = {
      data: null,
      sourceTrackingId: null,
      errors: null,
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: emptyResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.getEmailDisposition(sourceTrackingId)).to.be.rejectedWith(emptyResponse);
  });

  it('can return an error response for a non-existent message (HTTP 404)', async function () {
    const invalidSourceTrackingId = 'this-message-does-not-exist';

    const notFoundResponse = {
      data: {
        errors: [
          {
            code: 404,
            title: 'Message was not found',
            details: 'Message with this tracking id was not found',
          },
        ],
        sourceTrackingId: invalidSourceTrackingId,
      },
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: notFoundResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.getEmailDisposition(invalidSourceTrackingId);

    expect(response).to.deep.equal(notFoundResponse);
  });
});

describe('emailService.sendMessage', function () {
  let axiosStub;
  const message = Message({
    from: 'reception@authorized_domain.com',
    reply_to: 'reception@authorized_domain.com',
    to: ['person@example.com'],
    cc: ['accounts@authorized_domain.com'],
    bcc: null,
    subject: 'Test Email',
    allowNonTLS: false,
    forceSecureNotification: false,
    text_content: 'Hello world!',
    html_content: '<html><body><h1>Hello world!</h1></body></html>',
    attachments: null,
    list_unsubscribe: null,
    list_unsubscribe_post: null,
  });

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('posts the correct JSON payload to the correct Paubox API endpoint', async function () {
    const expectedPayload = JSON.stringify({
      data: {
        message: {
          recipients: ['person@example.com'],
          cc: ['accounts@authorized_domain.com'],
          bcc: null,
          headers: {
            subject: 'Test Email',
            from: 'reception@authorized_domain.com',
            'reply-to': 'reception@authorized_domain.com',
            'List-Unsubscribe': null,
            'List-Unsubscribe-Post': null,
          },
          allowNonTLS: false,
          forceSecureNotification: false,
          content: {
            'text/plain': 'Hello world!',
            'text/html': Buffer.from('<html><body><h1>Hello world!</h1></body></html>').toString(
              'base64',
            ),
          },
          attachments: null,
        },
      },
    });

    let capturedConfig;
    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: {
          sourceTrackingId: '3d38ab13-0af8-4028-bd45-52e882e0d584',
          customHeaders: {
            'X-Custom-Header': 'value',
          },
          data: 'Service OK',
        },
      });
    });

    const service = emailService(testCredentials);
    await service.sendMessage(message);

    expect(capturedConfig.method).to.equal('POST');
    expect(capturedConfig.url).to.equal('/messages');
    expect(capturedConfig.data).to.deep.equal(expectedPayload);
  });

  it('can return a successful response', async function () {
    const validResponse = {
      sourceTrackingId: '3d38ab13-0af8-4028-bd45-52e882e0d584',
      customHeaders: {
        'X-Custom-Header': 'value',
      },
      data: 'Service OK',
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.sendMessage(message);
    expect(response).to.deep.equal(validResponse);
  });

  it('can return an error response for a bad request (HTTP 400)', async function () {
    const badRequestResponse = {
      errors: [
        {
          code: 400,
          title: 'Error Title',
          details: 'Description of error',
        },
      ],
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: badRequestResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.sendMessage(message);
    expect(response).to.deep.equal(badRequestResponse);
  });

  it('raises the API response as an error if no data is returned from the Paubox API', async function () {
    const emptyResponse = {
      data: null,
      sourceTrackingId: null,
      errors: null,
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: emptyResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.sendMessage(message)).to.be.rejectedWith(emptyResponse);
  });
});

describe('emailService.sendBulkMessages', function () {
  let axiosStub;

  const messageAlice = Message({
    from: 'reception@authorized_domain.com',
    reply_to: 'Reception <reception@authorized_domain.com>',
    to: ['alice@example.com', 'Alice Anderson <alice@host.com>'],
    cc: ['accounts@authorized_domain.com'],
    bcc: null,
    subject: 'Hi Alice!',
    allowNonTLS: false,
    forceSecureNotification: false,
    text_content: 'Hi Alice!',
    html_content: '<html><body><h1>Hi Alice!</h1></body></html>',
    attachments: [
      {
        fileName: 'hello_alice.txt',
        contentType: 'text/plain',
        content: 'SGVsbG8gQm9iIQ==',
      },
    ],
    list_unsubscribe: null,
    list_unsubscribe_post: null,
  });

  const messageBob = Message({
    from: 'reception@authorized_domain.com',
    reply_to: 'Reception <reception@authorized_domain.com>',
    to: ['bob@example.com', 'Bob Brown <bob@host.com>'],
    cc: ['accounts@authorized_domain.com'],
    bcc: null,
    subject: 'Hi Bob!',
    allowNonTLS: false,
    forceSecureNotification: false,
    text_content: 'Hi Bob!',
    html_content: '<html><body><h1>Hi Bob!</h1></body></html>',
    attachments: [
      {
        fileName: 'hello_bob.txt',
        contentType: 'text/plain',
        content: 'SGVsbG8gQm9iIQ==',
      },
    ],
    list_unsubscribe: null,
    list_unsubscribe_post: null,
  });

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('posts the correct JSON payload to the correct Paubox API endpoint', async function () {
    const expectedPayload = JSON.stringify({
      data: {
        messages: [
          {
            recipients: ['alice@example.com', 'Alice Anderson <alice@host.com>'],
            cc: ['accounts@authorized_domain.com'],
            bcc: null,
            headers: {
              subject: 'Hi Alice!',
              from: 'reception@authorized_domain.com',
              'reply-to': 'Reception <reception@authorized_domain.com>',
              'List-Unsubscribe': null,
              'List-Unsubscribe-Post': null,
            },
            allowNonTLS: false,
            forceSecureNotification: false,
            content: {
              'text/plain': 'Hi Alice!',
              'text/html': Buffer.from('<html><body><h1>Hi Alice!</h1></body></html>').toString(
                'base64',
              ),
            },
            attachments: [
              {
                fileName: 'hello_alice.txt',
                contentType: 'text/plain',
                content: 'SGVsbG8gQm9iIQ==',
              },
            ],
          },
          {
            recipients: ['bob@example.com', 'Bob Brown <bob@host.com>'],
            cc: ['accounts@authorized_domain.com'],
            bcc: null,
            headers: {
              subject: 'Hi Bob!',
              from: 'reception@authorized_domain.com',
              'reply-to': 'Reception <reception@authorized_domain.com>',
              'List-Unsubscribe': null,
              'List-Unsubscribe-Post': null,
            },
            allowNonTLS: false,
            forceSecureNotification: false,
            content: {
              'text/plain': 'Hi Bob!',
              'text/html': Buffer.from('<html><body><h1>Hi Bob!</h1></body></html>').toString(
                'base64',
              ),
            },
            attachments: [
              {
                fileName: 'hello_bob.txt',
                contentType: 'text/plain',
                content: 'SGVsbG8gQm9iIQ==',
              },
            ],
          },
        ],
      },
    });

    let capturedConfig;
    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: {
          messages: [
            {
              sourceTrackingId: '3d38ab13-0af8-4028-bd45-999999999999',
              customHeaders: null,
              data: 'Service OK',
            },
            {
              sourceTrackingId: '3d38ab13-0af8-4028-bd45-000000000000',
              customHeaders: null,
              data: 'Service OK',
            },
          ],
        },
      });
    });

    const service = emailService(testCredentials);
    await service.sendBulkMessages([messageAlice, messageBob]);

    expect(capturedConfig.method).to.equal('POST');
    expect(capturedConfig.url).to.equal('/bulk_messages');
    expect(capturedConfig.data).to.deep.equal(expectedPayload);
  });

  it('can return a successful response', async function () {
    const validResponse = {
      messages: [
        {
          sourceTrackingId: '3d38ab13-0af8-4028-bd45-999999999999',
          customHeaders: {},
          data: 'Service OK',
        },
        {
          sourceTrackingId: '3d38ab13-0af8-4028-bd45-000000000000',
          customHeaders: {},
          data: 'Service OK',
        },
      ],
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.sendBulkMessages([messageAlice, messageBob]);
    expect(response).to.deep.equal(validResponse);
  });

  it('can return an error response for a bad request (HTTP 400)', async function () {
    const errorResponse = {
      errors: [
        {
          code: 400,
          title: 'Error Title',
          details: 'Description of error',
        },
      ],
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: errorResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.sendBulkMessages([messageAlice, messageBob]);
    expect(response).to.deep.equal(errorResponse);
  });

  it('raises the API response as an error if no data is returned from the Paubox API', async function () {
    const emptyResponse = {};

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: emptyResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.sendBulkMessages([messageAlice, messageBob])).to.be.rejectedWith(
      emptyResponse,
    );
  });
});

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
    let formDataPromise;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;

      // Create a promise that will resolve with the complete form data
      formDataPromise = new Promise((resolve) => {
        let capturedData = '';
        config.data.on('data', (chunk) => {
          capturedData += chunk;
        });
        config.data.on('end', () => {
          resolve(capturedData);
        });
      });

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
    let formDataPromise;

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;

      // Create a promise that will resolve with the complete form data
      formDataPromise = new Promise((resolve) => {
        let capturedData = '';
        config.data.on('data', (chunk) => {
          capturedData += chunk;
        });
        config.data.on('end', () => {
          resolve(capturedData);
        });
      });

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
});
