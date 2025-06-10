'use strict';

const axios = require('axios');

class apiHelper {
  constructor() {}

  callToAPIByPost(baseUrl, apiUrl, authHeader, reqBody) {
    var apiHeaders = {
      Authorization: `${authHeader}`,
      'Content-type': 'application/json',
    };

    const axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: apiHeaders,
    });

    return axiosInstance({ method: 'POST', url: apiUrl, data: reqBody, headers: apiHeaders })
      .then((response) => {
        return response.data;
      })
      .catch(function (error) {
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
      });
  }

  callToAPIByGet(baseUrl, apiUrl, authHeader) {
    var apiHeaders = {
      Authorization: `${authHeader}`,
      'Content-type': 'application/json',
    };

    const axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: apiHeaders,
    });

    return axiosInstance({ method: 'GET', url: apiUrl, data: null })
      .then((response) => {
        return response.data;
      })
      .catch(function (error) {
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
      });
  }
}

module.exports = function () {
  return new apiHelper();
};
