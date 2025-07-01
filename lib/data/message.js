'use strict';

const BaseMessage = require('./baseMessage');

/**
 * Creates a new Message object for sending email messages through Paubox using the sendMessage and sendTemplatedMessage
 * methods.
 *
 * NOTE: For templated messages, use the TemplatedMessage object and the sendTemplatedMessage method.
 *
 * @param {Object} options - Required. The message options
 *
 * @param {string} options.from - Required. The sender's email address. Should be from a domain that you have authorized.
 * @param {string[]} options.to - Required. Array of recipient email addresses
 * @param {string} options.text_content - Plain text content of the email.
 * @param {string} options.html_content - HTML content of the email.
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
class Message extends BaseMessage {
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
    this.plaintext = options.text_content;
    this.htmltext = options.html_content;
    this.validate();
  }

  // Performs some validation on the message object, throwing an error if the message is invalid.
  //
  // Messages must:
  //
  //   - have a from and to address
  //   - have either or both text and html content
  //
  validate() {
    if (!this.from) {
      throw new Error('From address is required');
    }
    if (!this.to) {
      throw new Error('One or more to addresses are required');
    }
    const hasContent = this.plaintext || this.htmltext;
    if (!hasContent) {
      throw new Error('Message must have either plaintext or html text');
    }
  }

  // Convert Message object to JSON object in Paubox API format
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
      content: {
        'text/plain': this.plaintext,
        'text/html': this.safeBase64Encode(this.htmltext),
      },
      attachments: this.attachments,
      allowNonTLS: this.parseBool(this.allowNonTLS),
      forceSecureNotification: this.parseBool(this.forceSecureNotification),
    };
  }
}
module.exports = function (options) {
  return new Message(options);
};
