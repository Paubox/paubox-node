"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require("dotenv").config();
var _message = require("./message");

var Paubox = function () {
  function Paubox(options) {
    _classCallCheck(this, Paubox);

    if (!options.apiKey) {
      throw new Error("apiKey is missing.");
    }
    if (!options.endpointUsername) {
      throw new Error("endpointUsername is missing.");
    }
    this.apiKey = options.apiKey;
    this.endpointUsername = options.endpointUsername;
    this.protocol = options.protocol || "https:";
    this.host = options.host || "api.paubox.net";
    this.port = options.protocol || 443;

    this.options = {
      apiKey: this.apiKey,
      endpointUsername: this.endpointUsername,
      baseUrl: this.protocol + "//" + this.host + "/" + this.endpointUsername
    };
  }

  _createClass(Paubox, [{
    key: "message",
    value: function message(options) {
      console.log(options);
      return _message(options);
    }
  }]);

  return Paubox;
}();

module.exports = function (options) {
  return new Paubox(options);
};