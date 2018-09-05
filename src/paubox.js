"use strict";
require("dotenv").config();
const message = require("./message");

class Paubox {
  constructor(options) {
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
    this.version = "v1";
    this.url = `${this.protocol}//${this.host}/${this.version}/${this.endpointUsername}`

    this.options = {
      apiKey: this.apiKey,
      endpointUsername: this.endpointUsername,
      url: `${this.protocol}//${this.host}/${this.endpointUsername}`
    };
  }
  message(options) {
    console.log(options);
    return message(options);
  }
}

module.exports = function (options) {
  return new Paubox(options);
};
