"use strict";

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
}

module.exports = function(options) {
  return new Message(options);
};