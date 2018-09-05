"use strict";

require("dotenv").config();
var config = require("../test/data/config.js");
var emailService = require("../lib/service/emailService.js");
var getEmailDispositionResponse = require("./data/CommonClasses.js");

var service = emailService(config);
service.getEmailDisposition("3b5c7b9e-32d6-41c3-9058-06eb2ca5073b").then(function (response) {
    var apiResponse = getEmailDispositionResponse(response);
    var dataJson = JSON.stringify(response);
    console.log("Response: " + dataJson);
}).catch(function (error) {
    var apiError = getEmailDispositionResponse(error);
    var dataJson = JSON.stringify(apiError);
    console.log("Error: " + apiError);
});