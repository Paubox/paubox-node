'use strict';

const apiHelper = require('./apiHelper.js');

const _getAuthHeader = Symbol('getAuthHeader');

const _returnForceSecureNotificationValue = Symbol('returnForceSecureNotificationValue');

class emailService {
  constructor(config) {
    config = Object.assign(
      {
        apiUsername: process.env.API_USERNAME,
        apiKey: process.env.API_KEY,
      },
      config,
    );

    if (!config.apiKey) {
      throw new Error('apiKey is missing.');
    }

    if (!config.apiUsername) {
      throw new Error('apiUsername is missing.');
    }

    this.apiKey = config.apiKey;
    this.apiUser = config.apiUsername;
    this.protocol = 'https:';
    this.host = 'api.paubox.net';
    this.port = 443;
    this.version = 'v1';
    this.baseURL = `${this.protocol}//${this.host}/${this.version}/${this.apiUser}/`;
  } // public methods

  getEmailDisposition(sourceTrackingId) {
    let apiHelperService = apiHelper();
    var apiUrl = '/message_receipt?sourceTrackingId=' + sourceTrackingId;
    return apiHelperService
      .callToAPIByGet(this.baseURL, apiUrl, this[_getAuthHeader]())
      .then((response) => {
        var apiResponse = response;

        if (
          apiResponse.data == null &&
          apiResponse.sourceTrackingId == null &&
          apiResponse.errors == null
        ) {
          throw apiResponse;
        }

        if (
          apiResponse != null &&
          apiResponse.data != null &&
          apiResponse.data.message != null &&
          apiResponse.data.message.message_deliveries != null &&
          apiResponse.data.message.message_deliveries.length > 0
        ) {
          for (let message_deliveries of apiResponse.data.message.message_deliveries) {
            if (message_deliveries.status.openedStatus == null) {
              message_deliveries.status.openedStatus = 'unopened';
            }
          }
        }

        return apiResponse;
      });
  }

  sendMessage(msg) {
    var requestBody = JSON.stringify({
      data: {
        message: msg.toJSON(),
      },
    });
    let apiHelperService = apiHelper();
    var apiUrl = '/messages';
    return apiHelperService
      .callToAPIByPost(this.baseURL, apiUrl, this[_getAuthHeader](), requestBody)
      .then((response) => {
        var apiResponse = response;

        if (
          apiResponse.data == null &&
          apiResponse.sourceTrackingId == null &&
          apiResponse.errors == null
        ) {
          throw apiResponse;
        }

        return apiResponse;
      });
  }

  sendBulkMessages(messages) {
    var reqObject = JSON.stringify({
      data: {
        messages: messages.map((message) => message.toJSON()),
      },
    });
    let apiHelperService = apiHelper();
    var apiUrl = '/bulk_messages';
    return apiHelperService
      .callToAPIByPost(this.baseURL, apiUrl, this[_getAuthHeader](), reqObject)
      .then((response) => {
        var apiResponse = response;

        if (
          apiResponse.data == null &&
          apiResponse.messages == null &&
          apiResponse.errors == null
        ) {
          throw apiResponse;
        }

        return apiResponse;
      });
  } // private methods

  [_getAuthHeader]() {
    var token = 'Token token=' + this.apiKey;
    return token;
  }

  [_returnForceSecureNotificationValue](forceSecureNotification) {
    var forceSecureNotificationValue = null;

    if (forceSecureNotification == null || forceSecureNotification == '') {
      return null;
    } else {
      forceSecureNotificationValue = forceSecureNotification.trim().toLowerCase();

      if (forceSecureNotificationValue == 'true') {
        return true;
      } else if (forceSecureNotificationValue == 'false') {
        return false;
      } else {
        return null;
      }
    }
  }
}

module.exports = function (options) {
  return new emailService(options);
};
