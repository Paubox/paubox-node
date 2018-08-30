"use strict";
const axios = require("axios");
// const qs = require("qs");

class Requestor {
  constructor(opts) {
    this.url = opts.url;
    this.headers = {
      authorization: `Token token=${opts.apiKey}`,
      "content-type": "application/json"
    };
    this.body = opts.body;
  }

  post() {
    const options = {
      url: this.url,
      headers: this.headers,
      data: this.body
    };

    function success(response) {
      console.log(response);
    }

    axios
      .post(this.url, options)
      .then(function() {
        console.log("success");
      })
      .catch(function() {
        console.log("success");
      });
  }
}

module.exports = function(options) {
  return new Requestor(options);
};
