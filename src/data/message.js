'use strict';

class Message {
  constructor(options) {
    this.from = options.from;
    this.replyTo = options.reply_to;
    this.to = options.to;
    this.cc = options.cc;
    this.bcc = options.bcc;
    this.subject = options.subject;
    this.allowNonTLS = options.allowNonTLS || false;
    this.forceSecureNotification = options.forceSecureNotification;
    this.attachments = options.attachments;
    this.listUnsubscribe = options.list_unsubscribe;
    this.listUnsubscribePost = options.list_unsubscribe_post;

    // Email content for non-templated messages (https://docs.paubox.com/docs/paubox_email_api/messages#send-message)
    this.plaintext = options.text_content;
    this.htmltext = options.html_content;

    // Email content for templated messages (https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#send-a-dynamically-templated-message)
    this.templateName = options.template_name;
    this.templateValues = options.template_values;

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
    const hasTemplate = this.templateName && this.templateValues;
    const hasContent = this.plaintext || this.htmltext;

    if (hasTemplate && hasContent) {
      throw new Error('Message cannot have both template and content fields');
    }

    if (!hasTemplate && !hasContent) {
      throw new Error('Message must have either template or content fields');
    }

    if (hasTemplate) {
      this.isTemplated = true;
      if (typeof this.templateValues !== 'object') {
        throw new Error('Template values must be a valid JSON object');
      }
    } else {
      this.isTemplated = false;
    }
  }


  // Convert Message object to JSON object in Paubox API format
  toJSON() {
    let base = {
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

    if (this.templateName && this.templateValues) {
      base = { ...base, template_name: this.templateName, template_values: this.templateValues };
    } else {
      base = { ...base, content: { 'text/plain': this.plaintext, 'text/html': this.safeBase64Encode(this.htmltext) } };
    }

    if (this.attachments) {
      base = { ...base, attachments: this.attachments };
    } else {
      base = { ...base, attachments: null };
    }

    return base;
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
