"use strict";

const apiHelper = require("./apiHelper.js");
const _getAuthheader = Symbol('getAuthheader');
const _convertMsgObjtoJSONReqObj = Symbol('convertMsgObjtoJSONReqObj');

class emailService {
  constructor() {
    if (!process.env.API_KEY) {
      throw new Error("apiKey is missing.");
    }
    if (!process.env.API_USERNAME) {
      throw new Error("apiUsername is missing.");
    }
    this.apiKey = process.env.API_KEY;
    this.apiUser = process.env.API_USERNAME;
    this.protocol = "https:";
    this.host = "api.paubox.net";
    this.port = 443;
    this.version = "v1";
    this.baseURL = `${this.protocol}//${this.host}/${this.version}/${this.apiUser}/`;
  }


  // private methods
  [_getAuthheader]() {
    var token = "Token token=" + this.apiKey;
    return token;
  }

  [_convertMsgObjtoJSONReqObj](msg) {
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
  
  getEmailDisposition(sourceTrackingId) {

    try {
      let apiHelperService = apiHelper();
      var apiUrl = "/message_receipt?sourceTrackingId=" + sourceTrackingId;
      return apiHelperService.callToAPIByGet(this.baseURL, apiUrl, this[_getAuthheader]())
        .then(response => {
          var apiResponse = response;
          if (apiResponse.data == null && apiResponse.sourceTrackingId == null && apiResponse.errors == null) {
            throw apiResponse;
          }

          if (apiResponse != null && apiResponse.data != null && apiResponse.data.message != null
            && apiResponse.data.message.message_deliveries != null && apiResponse.data.message.message_deliveries.length > 0) {
            for (let message_deliveries of apiResponse.data.message.message_deliveries) {
              if (message_deliveries.status.openedStatus == null) {
                message_deliveries.status.openedStatus = "unopened";
              }
            }
          }
          return apiResponse;
        });
    }
    catch (error) {
      throw new Error(error);
    }
  }



  sendMessage(msg) {

    try {

      var reqObject = this[_convertMsgObjtoJSONReqObj](msg);
      let apiHelperService = apiHelper();
      var apiUrl = "/messages";
      return apiHelperService.callToAPIByPost(this.baseURL, apiUrl, this[_getAuthheader](), reqObject)
        .then(response => {
          var apiResponse = response;
          if (apiResponse.data == null && apiResponse.sourceTrackingId == null && apiResponse.errors == null) {
            throw apiResponse;
          }
          return apiResponse;
        })
    }
    catch (error) {
      throw new Error(error);
    }

  }


}

module.exports = function (options) {
  return new emailService(options);
};
