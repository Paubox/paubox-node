'use strict';

const axios = require('axios');
const FormData = require('form-data');
class apiHelper {
  constructor(authHeader) {
    this.authHeader = authHeader;
    this.baseHeaders = {
      Authorization: `${authHeader}`,
    };
  }
  post(baseUrl, apiUrl, reqBody) {
    let headers = {
      ...this.baseHeaders,
    };
    if (reqBody instanceof FormData) {
      headers = {
        ...headers,
        ...reqBody.getHeaders(),
      };
    }
    const axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: headers,
    });
    return axiosInstance({
      method: 'POST',
      url: apiUrl,
      data: reqBody,
      transformRequest: reqBody instanceof FormData ? [(data) => data] : undefined,
      headers: headers,
    })
      .then((response) => {
        return response.data;
      })
      .catch((error) => this.handleError(error));
  }
  patch(baseUrl, apiUrl, reqBody) {
    let headers = {
      ...this.baseHeaders,
    };
    if (reqBody instanceof FormData) {
      headers = {
        ...headers,
        ...reqBody.getHeaders(),
      };
    }
    const axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: headers,
    });
    return axiosInstance({
      method: 'PATCH',
      url: apiUrl,
      data: reqBody,
      transformRequest: reqBody instanceof FormData ? [(data) => data] : undefined,
      headers: headers,
    })
      .then((response) => {
        return response.data;
      })
      .catch((error) => this.handleError(error));
  }
  get(baseUrl, apiUrl) {
    const headers = {
      ...this.baseHeaders,
      ...{
        'Content-Type': 'application/json',
      },
    };
    const axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: headers,
    });
    return axiosInstance({
      method: 'GET',
      url: apiUrl,
      data: null,
    })
      .then((response) => {
        return response.data;
      })
      .catch((error) => this.handleError(error));
  }
  delete(baseUrl, apiUrl) {
    const headers = {
      ...this.baseHeaders,
      ...{
        'Content-Type': 'application/json',
      },
    };
    const axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: headers,
    });
    return axiosInstance({
      method: 'DELETE',
      url: apiUrl,
      data: null,
    })
      .then((response) => {
        return response.data;
      })
      .catch((error) => this.handleError(error));
  }

  // Private method to handle errors
  handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status == 500) return error.message;
      else return error.response.data;
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      return error.request;
    } else {
      // Something happened in setting up the request that triggered an Error
      return error.message;
    }
  }
}
module.exports = function (authHeader) {
  return new apiHelper(authHeader);
};
