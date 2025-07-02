'use strict';

const BaseMessage = require('./baseMessage');

/**
 * Creates a new TemplatedMessage object for sending email messages through Paubox using the sendTemplatedMessage
 * method.
 *
 * @param {Object} options - Required. The message options
 *
 * @param {string} options.from - Required. The sender's email address. Should be from a domain that you have authorized.
 * @param {string[]} options.to - Required. Array of recipient email addresses
 * @param {string} options.template_name - Required. The name of the template to use.
 * @param {Object} options.template_values - Required. The values to use for the template. Must be a valid JSON object.
 *
 * Optional fields:
 * @param {string} [options.subject] - Optional. The email subject. Defaults to null.
 * @param {string} [options.reply_to] - Reply-to email address. Defaults to null.
 * @param {string[]} [options.cc] - Array of CC recipient email addresses. Defaults to null.
 * @param {string[]} [options.bcc] - Array of BCC recipient email addresses. Defaults to null.
 * @param {Object[]} [options.custom_headers={}] - JSON object of custom headers in the format { headerName: headerValue }. Defaults to empty object.
 * @param {boolean} [options.allowNonTLS=false] - Whether to allow non-TLS message delivery. Defaults to false.
 * @param {boolean} [options.forceSecureNotification=false] - Whether to force secure notifications. Defaults to false.
 * @param {Array<Object>} [options.attachments] - Array of attachment objects. Defaults to null.
 * @param {string} [options.list_unsubscribe] - List-Unsubscribe header value. Defaults to null.
 * @param {string} [options.list_unsubscribe_post] - List-Unsubscribe-Post header value. Defaults to null.
 *
 * @throws {Error} If validation fails
 */
class TemplatedMessage extends BaseMessage {
  constructor(options) {
    super();
    this.from = options.from;
    this.to = options.to;
    this.replyTo = options.reply_to || null;
    this.cc = options.cc || null;
    this.bcc = options.bcc || null;
    this.subject = options.subject || null;
    this.customHeaders = options.custom_headers || {};
    this.allowNonTLS = options.allowNonTLS || false;
    this.forceSecureNotification = options.forceSecureNotification || false;
    this.attachments = options.attachments || null;
    this.listUnsubscribe = options.list_unsubscribe || null;
    this.listUnsubscribePost = options.list_unsubscribe_post || null;
    this.templateName = options.template_name;
    this.templateValues = options.template_values;
    this.validate();
  }

  // Performs some validation on the message object, throwing an error if the message is invalid.
  //
  // Messages must:
  //
  //   - have a from and to address
  //   - have both a template name and template values
  //   - have valid JSON for template values
  //
  validate() {
    if (!this.from) {
      throw new Error('From address is required');
    }
    if (!this.to) {
      throw new Error('One or more to addresses are required');
    }
    if (!this.templateName) {
      throw new Error('Template name is required');
    }
    if (typeof this.templateValues !== 'object') {
      throw new Error('Template values must be a valid JSON object');
    }
  }

  // Convert Message object to JSON object in Paubox API format
  //
  // NOTE: `templateName` and `templateValues` are not included in the JSON object here, they are included in the
  //       request body when sending the message (see `emailService.sendTemplatedMessage`)
  //
  toJSON() {
    return {
      recipients: this.to,
      cc: this.cc,
      bcc: this.bcc,
      headers: {
        subject: this.subject,
        from: this.from,
        'reply-to': this.replyTo,
        'List-Unsubscribe': this.listUnsubscribe,
        'List-Unsubscribe-Post': this.listUnsubscribePost,
        ...this.customHeaders,
      },
      attachments: this.attachments,
      allowNonTLS: this.parseBool(this.allowNonTLS),
      forceSecureNotification: this.parseBool(this.forceSecureNotification),
    };
  }
}
module.exports = function (options) {
  return new TemplatedMessage(options);
};
