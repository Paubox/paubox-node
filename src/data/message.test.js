const chai = require('chai');
const { expect } = chai;
const Message = require('./message.js');

describe('Message.parseBool', function () {
  beforeEach(function () {
    this.message = Message(
      {
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
      }
    );
  });

  it('can return a boolean value for boolean values', function () {
    expect(this.message.parseBool(true)).to.equal(true);
    expect(this.message.parseBool(false)).to.equal(false);
  });

  it('can return a boolean value for string values', function () {
    expect(this.message.parseBool('true')).to.equal(true);
    expect(this.message.parseBool('TRUE')).to.equal(true);
    expect(this.message.parseBool('True')).to.equal(true);
    expect(this.message.parseBool('  True   ')).to.equal(true);
    expect(this.message.parseBool('     true   ')).to.equal(true);
    expect(this.message.parseBool('false')).to.equal(false);
    expect(this.message.parseBool('FALSE')).to.equal(false);
    expect(this.message.parseBool('False')).to.equal(false);
    expect(this.message.parseBool('  False   ')).to.equal(false);
    expect(this.message.parseBool('     false   ')).to.equal(false);
  });

  it('can return a boolean value for other values', function () {
    expect(this.message.parseBool('')).to.equal(false);
    expect(this.message.parseBool(null)).to.equal(false);
    expect(this.message.parseBool(undefined)).to.equal(false);
    expect(this.message.parseBool(0)).to.equal(false);
    expect(this.message.parseBool('Something else')).to.equal(false);
  });
});
