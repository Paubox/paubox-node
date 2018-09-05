"use strict";

const axios = require("axios");

class apiHelper {
    constructor() {            
    }

    callToAPIBypost(baseUrl,apiUrl, authHeader, reqBody) {
        var apiHeaders = {
            Authorization: `${authHeader}`,
            "Content-type": "application/json"
        };

        var axiosInstance = axios.create({
            baseURL: apiUrl,
            headers: apiHeaders,
        });

        return axiosInstance({ method: "POST", url: apiUrl, data: reqBody, headers: apiHeaders })
            .then(response => {
                return response.data;
            })
            .catch(error => {
                return error;
            });
    }

    callToAPIByGet(baseUrl,apiUrl, authHeader) {

        var apiHeaders = {
            Authorization: `${authHeader}`,
            "Content-type": "application/json"
        };

        const axiosInstance = axios.create({
            baseURL: baseUrl,
            headers: apiHeaders,
        });

        return axiosInstance({ method: "GET", url: apiUrl, data: null})
            .then(response => {
                return response.data;
            })
            .catch(error => {
                return error.response.data;
            });

    }
}

module.exports = function () {
    return new apiHelper();
};
