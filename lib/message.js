"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var requestor = require("./requestor");

var Message = function () {
  function Message(options) {
    _classCallCheck(this, Message);

    this.from = options.from;
    this.replyTo = options.replyTo;
    this.to = options.to;
    this.bcc = options.bcc;
    this.subject = options.subject;
    // this.allowNonTLS = options.allowNonTLS;
    this.text = options.text;
    this.html = options.html;
  }

  _createClass(Message, [{
    key: "send",
    value: function send() {}
  }]);

  return Message;
}();

module.exports = function (options) {
  return new Message(options);
};

var options = {
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