require("dotenv").config();
const paubox = require("../lib/paubox.js");
const requestor = require("../lib/requestor.js");
const config = require("../test/data/config.js");

console.log(config);
let pauboxObj = paubox(config);
console.log(pauboxObj);
let request = requestor(pauboxObj);
console.log(request);
let response = request.get("3b5c7b9e-32d6-41c3-9058-06eb2ca5073b");
console.log("Response: "+response);