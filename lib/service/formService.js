'use strict';

const axios = require('axios');
class formService {
  constructor() {
    this.baseURL = 'https://apx.paubox.com/forms';
  }

  // Get the full form definition (HTML, JSON schema, CSS) for a given form.
  //
  // https://docs.paubox.com/forms/get-form
  //
  // No authentication required.
  //
  // formId is the UUID of the form to retrieve
  //
  // returns a promise that resolves to the form object
  //
  async getForm(formId) {
    if (!formId) {
      throw new Error('formId is required');
    }
    const axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const response = await axiosInstance({
      method: 'GET',
      url: `/public/form_data/${formId}`,
    });
    const form = response.data;
    if (!form || !form.id) {
      throw form;
    }
    return form;
  }

  // Submit a respondent's answers for a form.
  //
  // https://docs.paubox.com/forms/submit-form
  //
  // No authentication required. Maximum request size is 250 MB.
  //
  // formId is the UUID of the form being submitted
  //
  // formData is a key-value object matching the form's field schema (form_json)
  //
  // attachments is an optional array of objects with name (filename) and
  // content (base64-encoded file content) fields
  //
  // returns a promise that resolves to null on success (201 No Content)
  //
  async submitForm(formId, formData, attachments = null) {
    if (!formId) {
      throw new Error('formId is required');
    }
    if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
      throw new Error('formData is required and must be an object');
    }
    const requestBody = {
      form_data: formData,
    };
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      requestBody.attachments = attachments;
    }
    const axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      maxBodyLength: 250 * 1024 * 1024,
      maxContentLength: 250 * 1024 * 1024,
    });
    await axiosInstance({
      method: 'POST',
      url: `/api/forms/${formId}/submissions`,
      data: requestBody,
    });
    return null;
  }
}
module.exports = function () {
  return new formService();
};
