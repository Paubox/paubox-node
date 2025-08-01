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
      });
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
      });
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
      });
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
      });
  }
}
module.exports = function (authHeader) {
  return new apiHelper(authHeader);
};
