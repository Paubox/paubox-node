'use strict';

const apiHelper = require('./apiHelper.js');

const _getAuthHeader = Symbol('getAuthHeader');

const _messageToJson = Symbol('messageToJson');

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
    var reqObject = this[_messageToJson](msg);

    let apiHelperService = apiHelper();
    var apiUrl = '/messages';
    return apiHelperService
      .callToAPIByPost(this.baseURL, apiUrl, this[_getAuthHeader](), reqObject)
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

  [_messageToJson](msg) {
    var reqObjectJSON = {};
    var data = {};
    var message = {};
    var content = {};
    var headers = {};
    var base64EncodedHtmlText = null;
    headers.subject = msg.subject;
    headers.from = msg.from;
    headers['reply-to'] = msg.replyTo;
    headers['List-Unsubscribe'] = msg.listUnsubscribe;
    headers['List-Unsubscribe-Post'] = msg.listUnsubscribePost;
    content['text/plain'] = msg.plaintext; //base 64 encoding html text

    if (msg.htmltext != null && msg.htmltext != '') {
      base64EncodedHtmlText = Buffer.from(msg.htmltext).toString('base64');
    }

    content['text/html'] = base64EncodedHtmlText;
    message.recipients = msg.to;
    message.cc = msg.cc;
    message.bcc = msg.bcc;
    message.headers = headers;
    message.allowNonTLS = msg.allowNonTLS;
    message.content = content;
    message.attachments = msg.attachments;

    var forceSecureNotificationValue = this[_returnForceSecureNotificationValue](
      msg.forceSecureNotification,
    );

    if (forceSecureNotificationValue != null) {
      message.forceSecureNotification = forceSecureNotificationValue;
    }

    data.message = message;
    reqObjectJSON.data = data;
    return JSON.stringify(reqObjectJSON);
  }
}

module.exports = function (options) {
  return new emailService(options);
};
