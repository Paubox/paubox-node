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

describe('emailService.sendTemplatedMessage', function () {
  let axiosStub;
  const validTemplatedMessage = TemplatedMessage({
    from: 'reception@authorized_domain.com',
    reply_to: 'reception@authorized_domain.com',
    to: ['person@example.com'],
    cc: ['accounts@authorized_domain.com'],
    bcc: null,
    subject: 'Welcome!',
    custom_headers: {
      'X-Custom-Header-1': 'value 1',
      'X-Custom-Header-2': 'value 2',
    },
    allowNonTLS: false,
    forceSecureNotification: false,
    template_name: 'welcome_email',
    template_values: {
      firstName: 'John',
      lastName: 'Doe',
    },
    attachments: null,
    list_unsubscribe: null,
    list_unsubscribe_post: null,
  });

  this.afterEach(() => {
    if (axiosStub) {
      axiosStub.restore();
    }
  });

  it('posts the correct JSON payload (including custom headers) to the correct Paubox API endpoint for a templated message', async function () {
    const expectedPayload = {
      data: {
        template_name: 'welcome_email',
        template_values: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
        }), // Content is passed as a JSON string
        message: {
          recipients: ['person@example.com'],
          cc: ['accounts@authorized_domain.com'],
          bcc: null,
          headers: {
            subject: 'Welcome!',
            from: 'reception@authorized_domain.com',
            'reply-to': 'reception@authorized_domain.com',
            'List-Unsubscribe': null,
            'List-Unsubscribe-Post': null,
            'X-Custom-Header-1': 'value 1',
            'X-Custom-Header-2': 'value 2',
          },
          allowNonTLS: false,
          forceSecureNotification: false,
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
            'X-Custom-Header': 'value',
          },
          data: 'Service OK',
        },
      });
    });

    const service = emailService(testCredentials);
    await service.sendTemplatedMessage(validTemplatedMessage);

    expect(capturedConfig.method).to.equal('POST');
    expect(capturedConfig.url).to.equal('/templated_messages');
    expect(capturedConfig.data).to.deep.equal(expectedPayload);
  });

  it('can return a successful response', async function () {
    const validResponse = {
      sourceTrackingId: '36770949-12a9-1234-b12d-b27abaa123ea',
      data: 'Service OK',
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.sendTemplatedMessage(validTemplatedMessage);
    expect(response).to.deep.equal(validResponse);
  });

  it('can return an error response for a bad request (HTTP 400)', async function () {
    const badRequestResponse = {
      code: 400,
      title: 'Invalid Request',
      details: {
        title: 'Missing values',
        details: 'Length of data.message.recipients should be at least 1',
        code: 400,
      },
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: badRequestResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.sendTemplatedMessage(validTemplatedMessage)).to.be.rejectedWith(
      badRequestResponse,
    );
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
    await expect(service.sendTemplatedMessage(validTemplatedMessage)).to.be.rejectedWith(
      emptyResponse,
    );
  });

  it('throws an error if the Message object is not a templated message', async function () {
    const nonTemplatedMessage = Message({
      from: 'reception@authorized_domain.com',
      reply_to: 'reception@authorized_domain.com',
      to: ['person@example.com'],
      subject: 'Test Email',
      text_content: 'Hello world!',
      html_content: '<html><body><h1>Hello world!</h1></body></html>',
    });

    const service = emailService(testCredentials);
    await expect(service.sendTemplatedMessage(nonTemplatedMessage)).to.be.rejectedWith(
      'Message must be a TemplatedMessage object',
    );
  });
});
