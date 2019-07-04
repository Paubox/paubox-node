
var emailService = require("./lib/service/emailService.js");
var message = require("./lib/data/message.js");


exports.emailService = function (config) {
    return new emailService(config);
};

exports.message = function (options) {
    return new message(options);
};