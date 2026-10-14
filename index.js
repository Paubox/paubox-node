const emailService = require('./lib/service/emailService.js');
const formService = require('./lib/service/formService.js');
const message = require('./lib/data/message.js');
const templatedMessage = require('./lib/data/templatedMessage.js');
const webhookService = require('./lib/service/webhookService.js');

module.exports.emailService = function (config) {
  return new emailService(config);
};

module.exports.formService = function (config) {
  return new formService(config);
};

module.exports.webhookService = function (config) {
  return new webhookService(config);
};

module.exports.message = function (options) {
  return new message(options);
};

module.exports.templatedMessage = function (options) {
  return new templatedMessage(options);
};
