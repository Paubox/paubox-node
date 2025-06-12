'use strict';

const apiHelper = require('./apiHelper.js');
const Stream = require('stream');
const FormData = require('form-data');
const _getAuthHeader = Symbol('getAuthHeader');

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
  }

  // public methods

  // Get the disposition of an email message with a given sourceTrackingId
  //
  // https://docs.paubox.com/docs/paubox_email_api/messages#get-email-disposition
  //
  // sourceTrackingId is the sourceTrackingId of the message which is returned from the sendMessage or sendBulkMessages
  // methods.
  //
  // returns a promise that resolves to the response from the API
  //
  getEmailDisposition(sourceTrackingId) {
    let apiHelperService = apiHelper();
    var apiUrl = '/message_receipt?sourceTrackingId=' + sourceTrackingId;
    return apiHelperService
      .get(this.baseURL, apiUrl, this[_getAuthHeader]())
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

  // Send an email message
  //
  // https://docs.paubox.com/docs/paubox_email_api/messages#send-message
  //
  // msg is a Message object
  //
  // returns a promise that resolves to the response from the API
  //
  sendMessage(msg) {
    var requestBody = JSON.stringify({
      data: {
        message: msg.toJSON(),
      },
    });

    let apiHelperService = apiHelper();
    var apiUrl = '/messages';
    return apiHelperService
      .post(this.baseURL, apiUrl, this[_getAuthHeader](), requestBody)
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

  // Send multiple email messages
  //
  // https://docs.paubox.com/docs/paubox_email_api/messages#send-bulk-messages
  //
  // messages is an array of Message objects
  //
  // returns a promise that resolves to the response from the API
  //
  sendBulkMessages(messages) {
    var requestBody = JSON.stringify({
      data: {
        messages: messages.map((message) => message.toJSON()),
      },
    });

    let apiHelperService = apiHelper();
    var apiUrl = '/bulk_messages';

    return apiHelperService
      .post(this.baseURL, apiUrl, this[_getAuthHeader](), requestBody)
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
  }

  // Create a dynamic template
  //
  // https://docs.paubox.com/docs/paubox_email_api/dynamic_templates/#create-a-dynamic-template
  //
  // templateName is the name of the template
  //
  // templateContent can be:
  //   - a string of the template content
  //   - a Buffer containing the template content
  //   - a Stream (for streaming uploads)
  //
  // returns a promise that resolves to the response from the API
  //
  createDynamicTemplate(templateName, templateContent) {
    const formData = new FormData();
    formData.append('data[name]', templateName);

    if (Buffer.isBuffer(templateContent)) {
      // For Buffer, we can append directly
      formData.append('data[body]', templateContent, {
        filename: `${templateName}.hbs`,
        contentType: 'text/x-handlebars-template',
      });
    } else if (templateContent instanceof Stream) {
      // For Stream, append directly
      formData.append('data[body]', templateContent, {
        filename: `${templateName}.hbs`,
        contentType: 'text/x-handlebars-template',
      });
    } else if (typeof templateContent === 'string') {
      // For string, convert to Buffer first
      formData.append('data[body]', Buffer.from(templateContent), {
        filename: `${templateName}.hbs`,
        contentType: 'text/x-handlebars-template',
      });
    } else {
      throw new Error('templateContent must be a Buffer, Stream, or string');
    }

    let apiHelperService = apiHelper();
    const apiUrl = '/dynamic_templates';

    return apiHelperService
      .post(this.baseURL, apiUrl, this[_getAuthHeader](), formData)
      .then((response) => {
        if (
          response.message == null &&
          response.params == null &&
          response.errors == null &&
          response.error == null
        ) {
          throw response;
        }
        return response;
      });
  }

  // Update a dynamic template
  //
  // https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#update-a-dynamic-template
  //
  // templateId is the id of the template as returned from the listDynamicTemplates method
  //
  // templateName is the new name of the template
  //
  // templateContent is the new content of the template and can be:
  //   - a string of the template content
  //   - a Buffer containing the template content
  //   - a Stream (for streaming uploads)
  //
  // returns a promise that resolves to the response from the API
  //
  updateDynamicTemplate(templateId, templateName = null, templateContent = null) {
    if (!templateName && !templateContent) {
      return Promise.reject(new Error('At least one of templateName or templateContent must be provided'));
    }

    const formData = new FormData();
    if (templateName) {
      formData.append('data[name]', templateName);
    }

    if (templateContent) {
      if (Buffer.isBuffer(templateContent)) {
        // For Buffer, we can append directly
        formData.append('data[body]', templateContent, {
          filename: `${templateName || 'template'}.hbs`,
          contentType: 'text/x-handlebars-template',
        });
      } else if (templateContent instanceof Stream) {
        // For Stream, append directly
        formData.append('data[body]', templateContent, {
          filename: `${templateName || 'template'}.hbs`,
          contentType: 'text/x-handlebars-template',
        });
      } else if (typeof templateContent === 'string') {
        // For string, convert to Buffer first
        formData.append('data[body]', Buffer.from(templateContent), {
          filename: `${templateName || 'template'}.hbs`,
          contentType: 'text/x-handlebars-template',
        });
      } else {
        throw new Error('templateContent must be a Buffer, Stream, or string');
      }
    }

    let apiHelperService = apiHelper();
    const apiUrl = `/dynamic_templates/${templateId}`;

    return apiHelperService
      .patch(this.baseURL, apiUrl, this[_getAuthHeader](), formData)
      .then((response) => {
        if (
          response.message == null &&
          response.params == null &&
          response.errors == null &&
          response.error == null
        ) {
          throw response;
        } else if (response.error) {
          throw new Error(response.error);
        }
        return response;
      });
  }

  // List dynamic templates
  //
  // https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#view-all-your-orgs-dynamic-templates
  //
  // returns a promise that resolves to the response from the API
  //
  listDynamicTemplates() {
    let apiHelperService = apiHelper();
    var apiUrl = '/dynamic_templates';
    return apiHelperService
      .get(this.baseURL, apiUrl, this[_getAuthHeader]())
      .then((response) => {
        var apiResponse = response;
        if (apiResponse instanceof Array) {
          return apiResponse;
        }
        throw apiResponse;
      });
  }

  // Get a dynamic template
  //
  // https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#view-one-of-your-orgs-dynamic-templates
  //
  // templateId is the id of the template as returned from the listDynamicTemplates method
  //
  // returns a promise that resolves to the response from the API
  //
  getDynamicTemplate(templateId) {
    let apiHelperService = apiHelper();
    var apiUrl = `/dynamic_templates/${templateId}`;

    const expectedKeys = [
      'id',
      'name',
      'api_customer_id',
      'body',
      'created_at',
      'updated_at',
      'metadata',
    ];

    return apiHelperService
      .get(this.baseURL, apiUrl, this[_getAuthHeader]())
      .then((response) => {
        if (response.error) {
          throw new Error(response.error);
        }

        if (!expectedKeys.every((key) => key in response)) {
          throw response;
        }

        return response;
      });
  }

  // Delete a dynamic template
  //
  // https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#delete-a-dynamic-template
  //
  // templateId is the id of the template as returned from the listDynamicTemplates method
  //
  // returns a promise that resolves to the response from the API
  //
  deleteDynamicTemplate(templateId) {
    let apiHelperService = apiHelper();
    var apiUrl = `/dynamic_templates/${templateId}`;
    return apiHelperService
      .delete(this.baseURL, apiUrl, this[_getAuthHeader]())
      .then((response) => {
        if (response.error) {
          throw new Error(response.error);
        }

        if (response.message == null) {
          throw response;
        }

        return response;
      });
  }

  // private methods

  [_getAuthHeader]() {
    var token = 'Token token=' + this.apiKey;
    return token;
  }
}

module.exports = function (options) {
  return new emailService(options);
};
