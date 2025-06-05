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
    this.plaintext = options.text_content;
    this.htmltext = options.html_content;
    this.attachments = options.attachments;
    this.listUnsubscribe = options.list_unsubscribe;
    this.listUnsubscribePost = options.list_unsubscribe_post;
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
      },
      allowNonTLS: this.parseBool(this.allowNonTLS),
      forceSecureNotification: this.parseBool(this.forceSecureNotification),
      content: {
        'text/plain': this.plaintext,
        'text/html': this.safeBase64Encode(this.htmltext),
      },
      attachments: this.attachments,
    }
  }

  // Safely base64 encodes a string, handling null and empty strings
  safeBase64Encode(text) {
    if (text == null || text == '') {
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
