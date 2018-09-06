"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var apiHelper = require("./apiHelper.js");
var _getAuthheader = Symbol('getAuthheader');
var _convertMsgObjtoJSONReqObj = Symbol('convertMsgObjtoJSONReqObj');

var emailService = function () {
  function emailService(options) {
    _classCallCheck(this, emailService);

    if (!options.apiKey) {
      throw new Error("apiKey is missing.");
    }
    if (!options.apiUser) {
      throw new Error("apiUser is missing.");
    }
    this.apiKey = options.apiKey;
    this.apiUser = options.apiUser;
    this.protocol = "https:";
    this.host = "api.paubox.net";
    this.port = 443;
    this.version = "v1";
    this.baseURL = this.protocol + "//" + this.host + "/" + this.version + "/" + this.apiUser + "/";
  }

  // private methods


  _createClass(emailService, [{
    key: _getAuthheader,
    value: function value() {
      var token = "Token token=" + this.apiKey;
      return token;
    }
  }, {
    key: _convertMsgObjtoJSONReqObj,
    value: function value(msg) {
      var reqObjectJSON = {};
      var data = {};
      var message = {};
      var content = {};
      var headers = {};

      headers.subject = msg.subject;
      headers.from = msg.from;
      headers["reply-to"] = msg.reply_to;

      content["text/plain"] = msg.plaintext;
      content["text/html"] = msg.htmltext;

      message.recipients = msg.to;
      message.bcc = msg.bcc;
      message.headers = headers;
      message.allowNonTLS = msg.allowNonTLS;
      message.content = content;
      message.attachments = msg.attachments;

      data.message = message;
      reqObjectJSON.data = data;

      return JSON.stringify(reqObjectJSON);
    }

    // public methods

  }, {
    key: "getEmailDisposition",
    value: function getEmailDisposition(sourceTrackingId) {

      try {
        var apiHelperService = apiHelper();
        var apiUrl = "/message_receipt?sourceTrackingId=" + sourceTrackingId;
        return apiHelperService.callToAPIByGet(this.baseURL, apiUrl, this[_getAuthheader]()).then(function (response) {
          var apiResponse = response;
          if (apiResponse.data == null && apiResponse.sourceTrackingId == null && apiResponse.errors == null) {
            throw apiResponse;
          }

          if (apiResponse != null && apiResponse.data != null && apiResponse.data.message != null && apiResponse.data.message.message_deliveries != null && apiResponse.data.message.message_deliveries.length > 0) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = apiResponse.data.message.message_deliveries[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var message_deliveries = _step.value;

                if (message_deliveries.status.openedStatus == null) {
                  message_deliveries.status.openedStatus = "unopened";
                }
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
          }
          return apiResponse;
        });
      } catch (error) {
        throw new Error(error);
      }
    }
  }, {
    key: "sendMessage",
    value: function sendMessage(msg) {

      try {

        var reqObject = this[_convertMsgObjtoJSONReqObj](msg);
        var apiHelperService = apiHelper();
        var apiUrl = "/messages";
        return apiHelperService.callToAPIByPost(this.baseURL, apiUrl, this[_getAuthheader](), reqObject).then(function (response) {
          var apiResponse = response;
          if (apiResponse.data == null && apiResponse.sourceTrackingId == null && apiResponse.errors == null) {
            throw apiResponse;
          }
          return apiResponse;
        });
      } catch (error) {
        throw new Error(error);
      }
    }
  }]);

  return emailService;
}();

module.exports = function (options) {
  return new emailService(options);
};