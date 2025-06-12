const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const emailService = require('./emailService.js');
const Message = require('../data/message.js');

chai.use(chaiAsPromised);

const testCredentials = {
  apiUsername: 'authorized_domain',
  apiKey: 'api-key-12345',
};

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
