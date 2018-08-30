const requestor = require("./requestor");

class Message {
  constructor(options) {
    this.from = options.from;
    this.replyTo = options.replyTo;
    this.to = options.to;
    this.bcc = options.bcc;
    this.subject = options.subject;
    // this.allowNonTLS = options.allowNonTLS;
    this.text = options.text;
    this.html = options.html;
  }

  send() {}
}

module.exports = function(options) {
  return new Message(options);
};

let options = {
  method: "POST",
  hostname: "api.paubox.net",
  port: null,
  path: "/v1/undefeatedgames/messages",
  headers: {
    "content-type": "application/json",
    authorization: "Token token=",
    "cache-control": "no-cache"
  }
};
