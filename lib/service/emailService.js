"use strict";
//require("dotenv").config();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var apiHelper = require("./apiHelper.js");
var getEmailDispositionResponse = require("../data/CommonClasses.js");

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

  _createClass(emailService, [{
    key: "getAuthheader",
    value: function getAuthheader() {
      var token = "Token token=" + this.apiKey;
      return token;
    }
  }, {
    key: "getEmailDisposition",
    value: function getEmailDisposition(sourceTrackingId) {

      try {
        var apiHelperService = apiHelper();
        var apiUrl = "/message_receipt?sourceTrackingId=" + sourceTrackingId;
        return apiHelperService.callToAPIByGet(this.baseURL, apiUrl, this.getAuthheader()).then(function (response) {
          var apiResponse = getEmailDispositionResponse(response);
          if (apiResponse != null && apiResponse.data != null && apiResponse.data.message != null && apiResponse.data.message.message_deliveries != null && apiResponse.data.message.message_deliveries.length > 0) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = apiResponse.data.message.message_deliveries[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var message_deliveries = _step.value;

                if (message_deliveries.status.openedStatus == "opened") {
                  apiResponse = getEmailDispositionResponse.update(apiResponse, message_deliveries.status.openedStatus = "unopened");
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
        }).catch(function (error) {
          var apiError = getEmailDispositionResponse(error);
          if (apiError.data == null && apiError.sourceTrackingId == null && apiError.errors == null) {
            throw new Error(response);
          }
          return apiError;
        });
      } catch (error) {
        console.log(error);
      }
    }
  }]);

  return emailService;
}();

module.exports = function (options) {
  return new emailService(options);
};