'use strict';

const apiHelper = require('./apiHelper.js');
const Stream = require('stream');
const FormData = require('form-data');

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

    this.apiHelper = apiHelper(`Token token=${this.apiKey}`);
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
  async getEmailDisposition(sourceTrackingId) {
    const response = await this.apiHelper
      .get(this.baseURL, `/message_receipt?sourceTrackingId=${sourceTrackingId}`);

    if (response.data == null && response.sourceTrackingId == null && response.errors == null) {
      throw response;
    }
    if (response?.data?.message?.message_deliveries?.length > 0) {
      for (let message_deliveries of response.data.message.message_deliveries) {
        if (message_deliveries.status.openedStatus == null) {
          message_deliveries.status.openedStatus = 'unopened';
        }
      }
    }

    return response;
  }

  // Send an email message
  //
  // https://docs.paubox.com/docs/paubox_email_api/messages#send-message
  //
  // msg is a Message object
  //
  // returns a promise that resolves to the response from the API
  //
  async sendMessage(msg) {
    var requestBody = JSON.stringify({
      data: {
        message: msg.toJSON(),
      },
    });

    const response = await this.apiHelper
      .post(this.baseURL, '/messages', requestBody);

    if (response.data == null && response.sourceTrackingId == null && response.errors == null) {
      throw response;
    }

    return response;
  }

  // Send multiple email messages
  //
  // https://docs.paubox.com/docs/paubox_email_api/messages#send-bulk-messages
  //
  // messages is an array of Message objects
  //
  // returns a promise that resolves to the response from the API
  //
  async sendBulkMessages(messages) {
    const requestBody = JSON.stringify({
      data: {
        messages: messages.map((message) => message.toJSON()),
      },
    });

    const response = await this.apiHelper
      .post(this.baseURL, '/bulk_messages', requestBody);

    if (response.data == null && response.messages == null && response.errors == null) {
      throw response;
    }

    return response;
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
  async createDynamicTemplate(templateName, templateContent) {
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

    const apiUrl = '/dynamic_templates';

    const response = await this.apiHelper
      .post(this.baseURL, apiUrl, formData);
    if (response.message == null &&
      response.params == null &&
      response.errors == null &&
      response.error == null) {
      throw response;
    }
    return response;
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
  async updateDynamicTemplate(templateId, templateName = null, templateContent = null) {
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

    const apiUrl = `/dynamic_templates/${templateId}`;

    const response = await this.apiHelper
      .patch(this.baseURL, apiUrl, formData);
    if (response.message == null &&
      response.params == null &&
      response.errors == null &&
      response.error == null) {
      throw response;
    } else if (response.error) {
      throw new Error(response.error);
    }
    return response;
  }

  // List dynamic templates
  //
  // https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#view-all-your-orgs-dynamic-templates
  //
  // returns a promise that resolves to the response from the API
  //
  async listDynamicTemplates() {
    const response = await this.apiHelper
      .get(this.baseURL, '/dynamic_templates');

    if (response instanceof Array) {
      return response;
    }

    throw response;
  }

  // Get a dynamic template
  //
  // https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#view-one-of-your-orgs-dynamic-templates
  //
  // templateId is the id of the template as returned from the listDynamicTemplates method
  //
  // returns a promise that resolves to the response from the API
  //
  async getDynamicTemplate(templateId) {
    const response = await this.apiHelper
      .get(this.baseURL, `/dynamic_templates/${templateId}`);

    const expectedKeys = ['id', 'name', 'api_customer_id', 'body', 'created_at', 'updated_at', 'metadata'];

    if (response.error) {
      throw new Error(response.error);
    }
    if (!expectedKeys.every((key) => key in response)) {
      throw response;
    }

    return response;
  }

  // Delete a dynamic template
  //
  // https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#delete-a-dynamic-template
  //
  // templateId is the id of the template as returned from the listDynamicTemplates method
  //
  // returns a promise that resolves to the response from the API
  //
  async deleteDynamicTemplate(templateId) {
    const response = await this.apiHelper
      .delete(this.baseURL, `/dynamic_templates/${templateId}`);

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.message) {
      throw response;
    }

    return response;
  }
}

module.exports = function (options) {
  return new emailService(options);
};
