const emailService = require('./lib/service/emailService.js');
const message = require('./lib/data/message.js');
const templatedMessage = require('./lib/data/templatedMessage.js');

module.exports.emailService = function (config) {
  return new emailService(config);
};

module.exports.message = function (options) {
  return new message(options);
};

module.exports.templatedMessage = function (options) {
  return new templatedMessage(options);
};
