
var emailService = require("./lib/service/emailService.js");
var message = require("./lib/data/message.js");


exports.emailService = function () {
    return new emailService();
};

exports.message = function (options) {
    return new message(options);
};