const chai = require('chai');
const { expect } = chai;
const Message = require('../src/data/message');

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

describe('Message.validate', function () {
  it('can construct a valid message', function () {
    const validNonTemplatedOptions = {
      from: 'sender@authorized_domain.com',
      reply_to: 'sender@authorized_domain.com',
      to: ['recipient@host.com'],
      cc: null,
      bcc: null,
      subject: 'Welcome!',
      text_content: 'Hello John Doe!',
      html_content: '<html><body><h1>Hello John Doe!</h1></body></html>',
    };

    const message = Message(validNonTemplatedOptions);

    expect(message.plaintext).to.equal('Hello John Doe!');
    expect(message.htmltext).to.equal('<html><body><h1>Hello John Doe!</h1></body></html>');
  });

  it('throws an error if neither plaintext nor html text are provided', function () {
    const invalidOptions = {
      from: 'sender@authorized_domain.com',
      reply_to: 'sender@authorized_domain.com',
      to: ['recipient@host.com'],
      cc: null,
      bcc: null,
      subject: 'Invalid Message',
    };

    expect(() => Message(invalidOptions)).to.throw(
      'Message must have either plaintext or html text',
    );
  });

  it('throws an error if the from address is not specified', function () {
    const invalidOptions = {
      reply_to: 'sender@authorized_domain.com',
      to: ['recipient@host.com'],
      subject: 'Invalid Message',
      text_content: 'Invalid message',
      html_content: '<html><body><h1>Invalid message</h1></body></html>',
    };

    expect(() => Message(invalidOptions)).to.throw('From address is required');
  });

  it('throws an error if the to addresses are not specified', function () {
    const invalidOptions = {
      from: 'sender@authorized_domain.com',
      reply_to: 'sender@authorized_domain.com',
      subject: 'Invalid Message',
      text_content: 'Invalid message',
      html_content: '<html><body><h1>Invalid message</h1></body></html>',
    };

    expect(() => Message(invalidOptions)).to.throw('One or more to addresses are required');
  });

  it('has sane defaults for optional fields', function () {
    const validOptions = {
      from: 'sender@authorized_domain.com',
      to: ['recipient@host.com'],
      text_content: 'Valid message',
      html_content: '<html><body><h1>Valid message</h1></body></html>',
    };

    const message = Message(validOptions);

    expect(message.replyTo).to.be.null;
    expect(message.subject).to.be.null;
    expect(message.cc).to.be.null;
    expect(message.bcc).to.be.null;
    expect(message.allowNonTLS).to.be.false;
    expect(message.forceSecureNotification).to.be.false;
    expect(message.attachments).to.be.null;
    expect(message.listUnsubscribe).to.be.null;
    expect(message.listUnsubscribePost).to.be.null;
  });
});
