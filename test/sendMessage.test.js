const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const emailService = require('../src/service/emailService.js');
const Message = require('../src/data/message.js');
const TemplatedMessage = require('../src/data/templatedMessage.js');

chai.use(chaiAsPromised);

const testCredentials = {
  apiUsername: 'authorized_domain',
  apiKey: 'api-key-12345',
};

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
    const expectedPayload = {
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
    };

    let capturedConfig;
    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: {
          sourceTrackingId: '3d38ab13-0af8-4028-bd45-52e882e0d584',
          customHeaders: {},
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
      customHeaders: {},
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

  it('throws the API response as an error if no data is returned from the Paubox API', async function () {
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

  it('throws an error if the Message object is a templated message', async function () {
    const templatedMessage = TemplatedMessage({
      from: 'reception@authorized_domain.com',
      reply_to: 'reception@authorized_domain.com',
      to: ['person@example.com'],
      subject: 'Welcome!',
      template_name: 'welcome_email',
      template_values: {
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    const service = emailService(testCredentials);
    await expect(service.sendMessage(templatedMessage)).to.be.rejectedWith(
      'Message must be a Message object',
    );
  });

  it('can send a message with custom headers', async function () {
    const messageWithCustomHeaders = Message({
      from: 'reception@authorized_domain.com',
      reply_to: 'reception@authorized_domain.com',
      to: ['person@example.com'],
      cc: ['accounts@authorized_domain.com'],
      bcc: null,
      subject: 'Test Email',
      custom_headers: {
        'X-Custom-Header-1': 'value 1',
        'X-Custom-Header-2': 'value 2',
      },
      allowNonTLS: false,
      forceSecureNotification: false,
      text_content: 'Hello world!',
      html_content: '<html><body><h1>Hello world!</h1></body></html>',
      attachments: null,
      list_unsubscribe: null,
      list_unsubscribe_post: null,
    });

    const expectedPayload = {
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
            'X-Custom-Header-1': 'value 1',
            'X-Custom-Header-2': 'value 2',
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
    };

    let capturedConfig;
    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: {
          sourceTrackingId: '3d38ab13-0af8-4028-bd45-52e882e0d584',
          customHeaders: {
            'X-Custom-Header-1': 'value 1',
            'X-Custom-Header-2': 'value 2',
          },
          data: 'Service OK',
        },
      });
    });

    const service = emailService(testCredentials);
    await service.sendMessage(messageWithCustomHeaders);

    expect(capturedConfig.method).to.equal('POST');
    expect(capturedConfig.url).to.equal('/messages');
    expect(capturedConfig.data).to.deep.equal(expectedPayload);
  });
});
