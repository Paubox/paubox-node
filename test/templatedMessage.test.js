const chai = require('chai');
const { expect } = chai;
const TemplatedMessage = require('../src/data/templatedMessage');

const templatedMessage = TemplatedMessage({
  from: 'sender@authorized_domain.com',
  reply_to: 'Sender Name <sender@authorized_domain.com>',
  to: ['recipient@host.com', 'Recipient Name <recipient2@host.com>'],
  cc: ['accounts@authorized_domain.com'],
  bcc: ['recipient3@host.com', 'Recipient Name <recipient4@host.com>'],
  custom_headers: {},
  subject: 'Test Email',
  allowNonTLS: false,
  forceSecureNotification: false,
  template_name: 'welcome_email',
  template_values: {
    firstName: 'John',
    lastName: 'Doe',
  },
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

describe('TemplatedMessage.parseBool', function () {
  it('can return a boolean value for boolean values', function () {
    expect(templatedMessage.parseBool(true)).to.equal(true);
    expect(templatedMessage.parseBool(false)).to.equal(false);
  });

  it('can return a boolean value for string values', function () {
    expect(templatedMessage.parseBool('true')).to.equal(true);
    expect(templatedMessage.parseBool('TRUE')).to.equal(true);
    expect(templatedMessage.parseBool('True')).to.equal(true);
    expect(templatedMessage.parseBool('  True   ')).to.equal(true);
    expect(templatedMessage.parseBool('     true   ')).to.equal(true);
    expect(templatedMessage.parseBool('false')).to.equal(false);
    expect(templatedMessage.parseBool('FALSE')).to.equal(false);
    expect(templatedMessage.parseBool('False')).to.equal(false);
    expect(templatedMessage.parseBool('  False   ')).to.equal(false);
    expect(templatedMessage.parseBool('     false   ')).to.equal(false);
  });

  it('can return a boolean value for other values', function () {
    expect(templatedMessage.parseBool('')).to.equal(false);
    expect(templatedMessage.parseBool(null)).to.equal(false);
    expect(templatedMessage.parseBool(undefined)).to.equal(false);
    expect(templatedMessage.parseBool(0)).to.equal(false);
    expect(templatedMessage.parseBool('Something else')).to.equal(false);
  });
});

describe('TemplatedMessage.toJSON', function () {
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
      attachments: [
        {
          fileName: 'hello_world.txt',
          contentType: 'text/plain',
          content: 'SGVsbG8gV29ybGQh',
        },
      ],
    };

    expect(templatedMessage.toJSON()).to.deep.equal(expectedJSON);
  });

  it('returns the correct JSON object with custom headers', function () {
    const templatedMessageWithCustomHeaders = TemplatedMessage({
      from: 'sender@authorized_domain.com',
      reply_to: 'Sender Name <sender@authorized_domain.com>',
      to: ['recipient@host.com', 'Recipient Name <recipient2@host.com>'],
      cc: ['accounts@authorized_domain.com'],
      bcc: ['recipient3@host.com', 'Recipient Name <recipient4@host.com>'],
      custom_headers: {
        'X-Custom-Header-1': 'Custom Value 1',
        'X-Custom-Header-2': 'Custom Value 2',
      },
      subject: 'Test Email',
      allowNonTLS: false,
      forceSecureNotification: false,
      template_name: 'welcome_email',
      template_values: {
        firstName: 'John',
        lastName: 'Doe',
      },
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
        'X-Custom-Header-1': 'Custom Value 1',
        'X-Custom-Header-2': 'Custom Value 2',
      },
      allowNonTLS: false,
      forceSecureNotification: false,
      attachments: [
        {
          fileName: 'hello_world.txt',
          contentType: 'text/plain',
          content: 'SGVsbG8gV29ybGQh',
        },
      ],
    };

    expect(templatedMessageWithCustomHeaders.toJSON()).to.deep.equal(expectedJSON);
  });
});

describe('TemplatedMessage.validate', function () {
  it('can construct a valid templated message', function () {
    const validOptions = {
      from: 'sender@authorized_domain.com',
      reply_to: 'sender@authorized_domain.com',
      to: ['recipient@host.com'],
      cc: null,
      bcc: null,
      subject: 'Welcome!',
      template_name: 'welcome_email',
      template_values: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    const message = TemplatedMessage(validOptions);

    expect(message.templateName).to.equal('welcome_email');
    expect(message.templateValues).to.deep.equal({
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  it('throws an error if the template name is not specified', function () {
    const invalidOptions = {
      from: 'sender@authorized_domain.com',
      reply_to: 'sender@authorized_domain.com',
      to: ['recipient@host.com'],
      cc: null,
      bcc: null,
      subject: 'Invalid Message',
      template_values: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    expect(() => TemplatedMessage(invalidOptions)).to.throw('Template name is required');
  });

  it('throws an error if the template values are not specified', function () {
    const invalidOptions = {
      from: 'sender@authorized_domain.com',
      reply_to: 'sender@authorized_domain.com',
      to: ['recipient@host.com'],
      subject: 'Invalid Message',
      template_name: 'welcome_email',
    };

    expect(() => TemplatedMessage(invalidOptions)).to.throw(
      'Template values must be a valid JSON object',
    );
  });

  it('throws an error if the to addresses are not specified', function () {
    const invalidOptions = {
      from: 'sender@authorized_domain.com',
      reply_to: 'sender@authorized_domain.com',
      subject: 'Invalid Message',
      template_name: 'welcome_email',
      template_values: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    expect(() => TemplatedMessage(invalidOptions)).to.throw(
      'One or more to addresses are required',
    );
  });

  it('has sane defaults for optional fields', function () {
    const minimalOptions = {
      from: 'sender@authorized_domain.com',
      to: ['recipient@host.com'],
      template_name: 'welcome_email',
      template_values: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    const templatedMessage = TemplatedMessage(minimalOptions);

    expect(templatedMessage.replyTo).to.be.null;
    expect(templatedMessage.subject).to.be.null;
    expect(templatedMessage.cc).to.be.null;
    expect(templatedMessage.bcc).to.be.null;
    expect(templatedMessage.customHeaders).to.deep.equal({});
    expect(templatedMessage.allowNonTLS).to.be.false;
    expect(templatedMessage.forceSecureNotification).to.be.false;
    expect(templatedMessage.attachments).to.be.null;
    expect(templatedMessage.listUnsubscribe).to.be.null;
    expect(templatedMessage.listUnsubscribePost).to.be.null;
  });
});
