"use strict";
//require("dotenv").config();

const apiHelper = require("./apiHelper.js");
var getEmailDispositionResponse = require("../data/CommonClasses.js");

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
          var apiResponse = getEmailDispositionResponse(response);
          if (apiResponse != null && apiResponse.data != null && apiResponse.data.message != null
            && apiResponse.data.message.message_deliveries != null && apiResponse.data.message.message_deliveries.length > 0) {
              for (let message_deliveries of apiResponse.data.message.message_deliveries) {
                if (message_deliveries.status.openedStatus == null) {
                  //apiResponse = getEmailDispositionResponse.update(apiResponse,message_deliveries.status.openedStatus = "unopened");
                }
              }
          }
          return apiResponse;
        })
        .catch(error => {
          var apiError = getEmailDispositionResponse(error);
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
