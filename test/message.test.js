const chai = require('chai');
const { expect } = chai;
const Message = require('../src/data/message.js');

const message = Message({
  from: 'sender@authorized_domain.com',
  reply_to: 'Sender Name <sender@authorized_domain.com>',
  to: ['recipient@host.com', 'Recipient Name <recipient2@host.com>'],
  cc: ['accounts@authorized_domain.com'],
  bcc: ['recipient3@host.com', 'Recipient Name <recipient4@host.com>'],
  subject: 'Test Email',
  allowNonTLS: false,
  forceSecureNotification: false,
  text_content: 'Hello world!',
  html_content: '<html><body><h1>Hello world!</h1></body></html>',
  attachments: [
    {
      fileName: 'hello_world.txt',
      contentType: 'text/plain',
      content: 'SGVsbG8gV29ybGQh',
    },
  ],
  list_unsubscribe: null,
  list_unsubscribe_post: null,
});

describe('Message.parseBool', function () {
  it('can return a boolean value for boolean values', function () {
    expect(message.parseBool(true)).to.equal(true);
    expect(message.parseBool(false)).to.equal(false);
  });

  it('can return a boolean value for string values', function () {
    expect(message.parseBool('true')).to.equal(true);
    expect(message.parseBool('TRUE')).to.equal(true);
    expect(message.parseBool('True')).to.equal(true);
    expect(message.parseBool('  True   ')).to.equal(true);
    expect(message.parseBool('     true   ')).to.equal(true);
    expect(message.parseBool('false')).to.equal(false);
    expect(message.parseBool('FALSE')).to.equal(false);
    expect(message.parseBool('False')).to.equal(false);
    expect(message.parseBool('  False   ')).to.equal(false);
    expect(message.parseBool('     false   ')).to.equal(false);
  });

  it('can return a boolean value for other values', function () {
    expect(message.parseBool('')).to.equal(false);
    expect(message.parseBool(null)).to.equal(false);
    expect(message.parseBool(undefined)).to.equal(false);
    expect(message.parseBool(0)).to.equal(false);
    expect(message.parseBool('Something else')).to.equal(false);
  });
});

describe('Message.toJSON', function () {
  it('returns the correct JSON object', function () {
    const expectedJSON = {
      recipients: ['recipient@host.com', 'Recipient Name <recipient2@host.com>'],
      cc: ['accounts@authorized_domain.com'],
      bcc: ['recipient3@host.com', 'Recipient Name <recipient4@host.com>'],
      headers: {
        subject: 'Test Email',
        from: 'sender@authorized_domain.com',
        'reply-to': 'Sender Name <sender@authorized_domain.com>',
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
      attachments: [
        {
          fileName: 'hello_world.txt',
          contentType: 'text/plain',
          content: 'SGVsbG8gV29ybGQh',
        },
      ],
    };

    expect(message.toJSON()).to.deep.equal(expectedJSON);
  });
});
