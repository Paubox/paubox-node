"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var axios = require("axios");
// const qs = require("qs");

var Requestor = function () {
  function Requestor(opts) {
    _classCallCheck(this, Requestor);

    this.url = opts.url;
    this.headers = {
      authorization: "Token token=" + opts.apiKey,
      "content-type": "application/json"
    };
    this.body = opts.body;
  }

  _createClass(Requestor, [{
    key: "post",
    value: function post() {
      var options = {
        url: this.url,
        headers: this.headers,
        data: this.body
      };

      function success(response) {
        console.log(response);
      }

      axios.post(this.url, options).then(function () {
        console.log("success");
      }).catch(function () {
        console.log("success");
      });
    }
  }]);

  return Requestor;
}();

module.exports = function (options) {
  return new Requestor(options);
};