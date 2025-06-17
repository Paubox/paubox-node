'use strict';

/**
 * Creates a new Message object for sending email messages through Paubox
 *
 * @param {Object} options - Required. The message options
 *
 * @param {string} options.from - Required. The sender's email address. Should be from a domain that you have authorized.
 * @param {string[]} options.to - Required. Array of recipient email addresses
*
* For non-templated messages, one of these is required:
* @param {string} [options.text_content] - Plain text content of the email. Defaults to null.
* @param {string} [options.html_content] - HTML content of the email. Defaults to null.
*
* For templated messages, both of these are required:
* @param {string} [options.template_name] - Name of the template to use. Defaults to null.
* @param {Object} [options.template_values] - JSON object containing template variables. Defaults to null.
*
* Optional fields:
 * @param {string} [options.subject] - Optional. The email subject. Defaults to null.
 * @param {string} [options.reply_to] - Reply-to email address. Defaults to null.
 * @param {string[]} [options.cc] - Array of CC recipient email addresses. Defaults to null.
 * @param {string[]} [options.bcc] - Array of BCC recipient email addresses. Defaults to null.
 * @param {boolean} [options.allowNonTLS=false] - Whether to allow non-TLS message delivery. Defaults to false.
 * @param {boolean} [options.forceSecureNotification=false] - Whether to force secure notifications. Defaults to false.
 * @param {Array<Object>} [options.attachments] - Array of attachment objects. Defaults to null.
 * @param {string} [options.list_unsubscribe] - List-Unsubscribe header value. Defaults to null.
 * @param {string} [options.list_unsubscribe_post] - List-Unsubscribe-Post header value. Defaults to null.
 *
 * @throws {Error} If validation fails
 */
class Message {
  constructor(options) {
    this.from = options.from;
    this.to = options.to;
    this.replyTo = options.reply_to || null;
    this.cc = options.cc || null;
    this.bcc = options.bcc || null;
    this.subject = options.subject || null;
    this.allowNonTLS = options.allowNonTLS || false;
    this.forceSecureNotification = options.forceSecureNotification || false;
    this.attachments = options.attachments || null;
    this.listUnsubscribe = options.list_unsubscribe || null;
    this.listUnsubscribePost = options.list_unsubscribe_post || null;

    // Email content for non-templated messages (https://docs.paubox.com/docs/paubox_email_api/messages#send-message)
    this.plaintext = options.text_content || null;
    this.htmltext = options.html_content || null;

    // Email content for templated messages (https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#send-a-dynamically-templated-message)
    this.templateName = options.template_name || null;
    this.templateValues = options.template_values || null;

    // Determine if this is a templated message
    this.isTemplated = Boolean(this.templateName && this.templateValues);

    this.validate();
  }

  // Performs some validation on the message object, throwing an error if the message is invalid.
  //
  // Messages must:
  // - have either templated or non-templated content fields, but not both.
  // - have template values if a template name is provided.
  // - have valid JSON for template values.
  //
  validate() {
    if (!this.from) {
      throw new Error('From address is required');
    }

    if (!this.to) {
      throw new Error('To address(es) are required');
    }

    const hasContent = this.plaintext || this.htmltext;

    if (this.isTemplated && hasContent) {
      throw new Error('Message cannot have both template and content fields');
    }

    if (!this.isTemplated && !hasContent) {
      throw new Error('Message must have either template or content fields');
    }

    if (this.isTemplated) {
      if (typeof this.templateValues !== 'object') {
        throw new Error('Template values must be a valid JSON object');
      }
    }
  }

  // Convert Message object to JSON object in Paubox API format
  toJSON() {
    let jsonContent = {
      recipients: this.to,
      cc: this.cc,
      bcc: this.bcc,
      headers: {
        subject: this.subject,
        from: this.from,
        'reply-to': this.replyTo,
        'List-Unsubscribe': this.listUnsubscribe,
        'List-Unsubscribe-Post': this.listUnsubscribePost,
      },
      allowNonTLS: this.parseBool(this.allowNonTLS),
      forceSecureNotification: this.parseBool(this.forceSecureNotification),
    };

    if (!this.isTemplated) {
      jsonContent = {
        ...jsonContent,
        content: {
          'text/plain': this.plaintext,
          'text/html': this.safeBase64Encode(this.htmltext),
        },
      };
    }

    if (this.attachments) {
      jsonContent = { ...jsonContent, attachments: this.attachments };
    } else {
      jsonContent = { ...jsonContent, attachments: null };
    }

    return jsonContent;
  }

  // Safely base64 encodes a string, handling null and empty strings
  safeBase64Encode(text) {
    if (text === null || text === undefined || text === '') {
      return null;
    } else {
      return Buffer.from(text).toString('base64');
    }
  }

  // Parses an input to a boolean value, always returns a boolean value.
  parseBool(value) {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return String(value).trim().toLowerCase() === 'true';
  }
}

module.exports = function (options) {
  return new Message(options);
};
