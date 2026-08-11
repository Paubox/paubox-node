'use strict';

const axios = require('axios');
class formService {
  constructor(config = {}) {
    config = Object.assign(
      {
        apiKey: process.env.FORMS_API_KEY,
      },
      config,
    );
    this.baseURL = 'https://apx.paubox.com/forms';
    this.apiKey = config.apiKey || null;
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

  // Throws when no API key was configured. Called by every authenticated
  // method before making a request.
  //
  _requireApiKey() {
    if (!this.apiKey) {
      throw new Error(
        'apiKey is required for this method. Pass { apiKey } to formService() or set the FORMS_API_KEY environment variable.',
      );
    }
  }

  // Builds an axios instance with the Authorization header for
  // authenticated requests. extraConfig extends the base config
  // (e.g. responseType).
  //
  _authorizedAxios(extraConfig = {}) {
    return axios.create(
      Object.assign(
        {
          baseURL: this.baseURL,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.apiKey,
          },
        },
        extraConfig,
      ),
    );
  }

  // List the customer's forms with optional filtering, ordering, and
  // pagination.
  //
  // Requires a scoped API key with the forms scope.
  //
  // params is an optional object; only provided keys are sent as query
  // parameters: customer_id, form_id, search, order ('asc'|'desc'),
  // order_by ('title'|'updated_at'|'submission_count'), archived (bool),
  // active (bool), page, items (max 100)
  //
  // returns a promise that resolves to { results, page_info }
  //
  async listForms(params = {}) {
    this._requireApiKey();
    const allowedParams = [
      'customer_id',
      'form_id',
      'search',
      'order',
      'order_by',
      'archived',
      'active',
      'page',
      'items',
    ];
    const queryParams = {};
    for (const key of allowedParams) {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams[key] = params[key];
      }
    }
    const axiosInstance = this._authorizedAxios();
    const response = await axiosInstance({
      method: 'GET',
      url: '/api/forms',
      params: queryParams,
    });
    if (!response.data || !Array.isArray(response.data.results)) {
      throw response.data;
    }
    return response.data;
  }

  // Get a single form by id. Unlike getForm, this returns any of the
  // customer's forms, including archived and inactive ones.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form to retrieve
  //
  // returns a promise that resolves to the form object
  //
  async getFormById(formId) {
    this._requireApiKey();
    if (!formId) {
      throw new Error('formId is required');
    }
    const axiosInstance = this._authorizedAxios();
    const response = await axiosInstance({
      method: 'GET',
      url: `/api/forms/${formId}`,
    });
    if (!response.data || !response.data.data || !response.data.data.id) {
      throw response.data;
    }
    return response.data.data;
  }

  // Create a new form.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formAttributes is an object with required fields title (string),
  // form_json (object), customer_id, and version; optional fields are
  // description, form_html, form_css, recipient, signable,
  // signature_confirmation_label, subscription_list_id, type, active,
  // and submission_count
  //
  // returns a promise that resolves to { id } for the new form
  //
  async createForm(formAttributes) {
    this._requireApiKey();
    if (!formAttributes || typeof formAttributes !== 'object' || Array.isArray(formAttributes)) {
      throw new Error('formAttributes is required and must be an object');
    }
    const requiredFields = ['title', 'form_json', 'customer_id', 'version'];
    for (const field of requiredFields) {
      if (formAttributes[field] === undefined || formAttributes[field] === null) {
        throw new Error(`${field} is required`);
      }
    }
    const allowedFields = [
      'title',
      'form_json',
      'customer_id',
      'version',
      'description',
      'form_html',
      'form_css',
      'recipient',
      'signable',
      'signature_confirmation_label',
      'subscription_list_id',
      'type',
      'active',
      'submission_count',
    ];
    const requestBody = {};
    for (const field of allowedFields) {
      if (formAttributes[field] !== undefined) {
        requestBody[field] = formAttributes[field];
      }
    }
    const axiosInstance = this._authorizedAxios();
    const response = await axiosInstance({
      method: 'POST',
      url: '/api/forms',
      data: requestBody,
    });
    if (!response.data || !response.data.id) {
      throw response.data;
    }
    return response.data;
  }

  // Update an existing form. Only the provided keys are changed; omitted
  // keys are left unchanged server-side.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form to update
  //
  // updates is an object with at least one of: title, description,
  // form_json, vanity_url, recipient, active, subscription_list_id
  //
  // returns a promise that resolves to { detail, form_id }
  //
  async updateForm(formId, updates) {
    this._requireApiKey();
    if (!formId) {
      throw new Error('formId is required');
    }
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new Error('updates is required and must be an object');
    }
    const updatableFields = [
      'title',
      'description',
      'form_json',
      'vanity_url',
      'recipient',
      'active',
      'subscription_list_id',
    ];
    const requestBody = {};
    for (const field of updatableFields) {
      if (updates[field] !== undefined) {
        requestBody[field] = updates[field];
      }
    }
    if (Object.keys(requestBody).length === 0) {
      throw new Error('updates must include at least one updatable field');
    }
    const axiosInstance = this._authorizedAxios();
    const response = await axiosInstance({
      method: 'PUT',
      url: `/api/forms/${formId}`,
      data: requestBody,
    });
    if (!response.data || !response.data.detail) {
      throw response.data;
    }
    return response.data;
  }

  // Archive a form. The server also sets active to false.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form to archive
  //
  // returns a promise that resolves to { detail }
  //
  async archiveForm(formId) {
    this._requireApiKey();
    if (!formId) {
      throw new Error('formId is required');
    }
    const axiosInstance = this._authorizedAxios();
    const response = await axiosInstance({
      method: 'POST',
      url: `/api/forms/${formId}/archive`,
    });
    if (!response.data || !response.data.detail) {
      throw response.data;
    }
    return response.data;
  }

  // Unarchive a previously archived form.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form to unarchive
  //
  // returns a promise that resolves to { detail }
  //
  async unarchiveForm(formId) {
    this._requireApiKey();
    if (!formId) {
      throw new Error('formId is required');
    }
    const axiosInstance = this._authorizedAxios();
    const response = await axiosInstance({
      method: 'POST',
      url: `/api/forms/${formId}/unarchive`,
    });
    if (!response.data || !response.data.detail) {
      throw response.data;
    }
    return response.data;
  }

  // Copy an existing form to a new form with the given title. The copy
  // gets a fresh id, a null vanity_url, and a submission_count of 0.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form to copy
  //
  // title is the title for the new form
  //
  // returns a promise that resolves to the new form object
  //
  async copyForm(formId, title) {
    this._requireApiKey();
    if (!formId) {
      throw new Error('formId is required');
    }
    if (!title) {
      throw new Error('title is required');
    }
    const axiosInstance = this._authorizedAxios();
    const response = await axiosInstance({
      method: 'POST',
      url: '/api/forms/copy',
      data: {
        form_id: formId,
        title: title,
      },
    });
    if (!response.data || !response.data.id) {
      throw response.data;
    }
    return response.data;
  }

  // Get aggregate form statistics for a customer.
  //
  // Requires a scoped API key with the forms scope.
  //
  // customerId is optional; when omitted the server defaults to the API
  // key's customer
  //
  // returns a promise that resolves to { active_form_count,
  // total_submission_count, submissions_last_7_days }
  //
  async getFormStats(customerId = null) {
    this._requireApiKey();
    const queryParams = {};
    if (customerId !== undefined && customerId !== null) {
      queryParams.customer_id = customerId;
    }
    const axiosInstance = this._authorizedAxios();
    const response = await axiosInstance({
      method: 'GET',
      url: '/api/forms/stats',
      params: queryParams,
    });
    if (!response.data || response.data.active_form_count === undefined) {
      throw response.data;
    }
    return response.data;
  }

  // List a form's submissions with optional filtering, ordering, and
  // pagination.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form whose submissions to list
  //
  // params is an optional object; only provided keys are sent as query
  // parameters: submission_id, order_by ('submitter_email'), order
  // ('asc'|'desc'), page, items (max 100)
  //
  // returns a promise that resolves to { data, total, page, items }
  //
  async listSubmissions(formId, params = {}) {
    this._requireApiKey();
    if (!formId) {
      throw new Error('formId is required');
    }
    const allowedParams = ['submission_id', 'order_by', 'order', 'page', 'items'];
    const queryParams = {};
    for (const key of allowedParams) {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams[key] = params[key];
      }
    }
    const axiosInstance = this._authorizedAxios();
    const response = await axiosInstance({
      method: 'GET',
      url: `/api/forms/${formId}/submissions`,
      params: queryParams,
    });
    if (!response.data || !Array.isArray(response.data.data)) {
      throw response.data;
    }
    return response.data;
  }

  // Export a form's submissions as CSV ('Created At' column followed by
  // the form's field labels).
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form whose submissions to export
  //
  // submissionId is optional; when provided, only that submission is
  // exported
  //
  // returns a promise that resolves to the CSV content as a string
  //
  async exportSubmissionsCsv(formId, submissionId = null) {
    this._requireApiKey();
    if (!formId) {
      throw new Error('formId is required');
    }
    let url = `/api/forms/${formId}/submissions/submission-csv`;
    if (submissionId) {
      url += `/${submissionId}`;
    }
    const axiosInstance = this._authorizedAxios({
      responseType: 'text',
    });
    const response = await axiosInstance({
      method: 'GET',
      url: url,
    });
    if (typeof response.data !== 'string') {
      throw response.data;
    }
    return response.data;
  }

  // Export a single submission as a PDF.
  //
  // Requires a scoped API key with the forms scope.
  //
  // formId is the UUID of the form the submission belongs to
  //
  // submissionId is the UUID of the submission to export
  //
  // returns a promise that resolves to the binary PDF content
  //
  async exportSubmissionPdf(formId, submissionId) {
    this._requireApiKey();
    if (!formId) {
      throw new Error('formId is required');
    }
    if (!submissionId) {
      throw new Error('submissionId is required');
    }
    const axiosInstance = this._authorizedAxios({
      responseType: 'arraybuffer',
    });
    const response = await axiosInstance({
      method: 'GET',
      url: `/api/forms/${formId}/submissions/${submissionId}/submission-pdf`,
    });
    if (response.data === null || response.data === undefined) {
      throw response.data;
    }
    return response.data;
  }
}
module.exports = function (config) {
  return new formService(config);
};
