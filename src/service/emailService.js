"use strict";

const apiHelper = require("./apiHelper.js");

class emailService {
  constructor(options) {
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
    this.baseURL = `${this.protocol}//${this.host}/${this.version}/${this.apiUser}/`;
  }

  getAuthheader() {
    var token = "Token token=" + this.apiKey;
    return token;
  }

  getEmailDisposition(sourceTrackingId) {

    try {
      let apiHelperService = apiHelper();
      var apiUrl = "/message_receipt?sourceTrackingId=" + sourceTrackingId;
      return apiHelperService.callToAPIByGet(this.baseURL, apiUrl, this.getAuthheader())
        .then(response => {
          var apiResponse = response;
          if (apiResponse != null && apiResponse.data != null && apiResponse.data.message != null
            && apiResponse.data.message.message_deliveries != null && apiResponse.data.message.message_deliveries.length > 0) {
            for (let message_deliveries of apiResponse.data.message.message_deliveries) {
              if (message_deliveries.status.openedStatus == null) {
                message_deliveries.status.openedStatus = "unopened";
              }
            }
          }
          return apiResponse;
        })
        .catch(error => {
          var apiError = error;
          if (apiError.data == null && apiError.sourceTrackingId == null && apiError.errors == null) {
            throw new Error(response);
          }
          return apiError;
        });


    }

    catch (error) {
      console.log(error);
    }
  }

  ConvertMsgObjecttoJSONReqObject(msg) {
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

  sendMessage(msg) {

    try {
      var reqObject = this.ConvertMsgObjecttoJSONReqObject(msg);
      let apiHelperService = apiHelper();
      var apiUrl = "/messages";
      return apiHelperService.callToAPIByPost(this.baseURL, apiUrl, this.getAuthheader(), reqObject)
        .then(response => {
          var apiResponse = response;
          return apiResponse;
        })
        .catch(error => {
          var apiError = error;
          if (apiError.data == null && apiError.sourceTrackingId == null && apiError.errors == null) {
            throw new Error(response);
          }
          return apiError;
        });


    }
    catch (error) {
      console.log(error);
    }

  }


}

module.exports = function (options) {
  return new emailService(options);
};
