"use strict";

require("dotenv").config();
var paubox = require("../lib/paubox.js");
var requestor = require("../lib/requestor.js");
var config = require("../test/data/config.js");

console.log(config);
var pauboxObj = paubox(config);
console.log(pauboxObj);
var request = requestor(pauboxObj);
console.log(request);
var response = request.get("3b5c7b9e-32d6-41c3-9058-06eb2ca5073b");
console.log("Response: " + response);