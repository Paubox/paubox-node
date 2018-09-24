"use strict";

class Message {
  constructor(options) {
    this.from = options.from;
    this.replyTo = options.reply_to;
    this.to = options.to;
    this.bcc = options.bcc;
    this.subject = options.subject;
    this.allowNonTLS = options.allowNonTLS || false;
    this.plaintext = options.text_content;
    this.htmltext = options.html_content;
    this.attachments = options.attachments;
  }  
}

module.exports = function(options) {
  return new Message(options);
};