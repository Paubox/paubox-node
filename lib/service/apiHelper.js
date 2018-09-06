"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var axios = require("axios");

var apiHelper = function () {
    function apiHelper() {
        _classCallCheck(this, apiHelper);
    }

    _createClass(apiHelper, [{
        key: "callToAPIByPost",
        value: function callToAPIByPost(baseUrl, apiUrl, authHeader, reqBody) {
            var apiHeaders = {
                Authorization: "" + authHeader,
                "Content-type": "application/json"
            };

            var axiosInstance = axios.create({
                baseURL: baseUrl,
                headers: apiHeaders
            });

            return axiosInstance({ method: "POST", url: apiUrl, data: reqBody, headers: apiHeaders }).then(function (response) {
                return response.data;
            }).catch(function (error) {
                return error.response.data;
            });
        }
    }, {
        key: "callToAPIByGet",
        value: function callToAPIByGet(baseUrl, apiUrl, authHeader) {

            var apiHeaders = {
                Authorization: "" + authHeader,
                "Content-type": "application/json"
            };

            var axiosInstance = axios.create({
                baseURL: baseUrl,
                headers: apiHeaders
            });

            return axiosInstance({ method: "GET", url: apiUrl, data: null }).then(function (response) {
                return response.data;
            }).catch(function (error) {
                return error.response.data;
            });
        }
    }]);

    return apiHelper;
}();

module.exports = function () {
    return new apiHelper();
};