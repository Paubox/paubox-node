"use strict";

var pauboxjs = require("paubox-js");
require("dotenv").config();
var service = pauboxjs.emailService();

var options = {
    from: 'renee@undefeatedgames.com',
    to: ['someone@domain.com'],
    bcc: ['someone2@domain.com'],
    reply_to: 'renee@undefeatedgames.com',
    subject: 'Testing from paubox node test',
    text_content: 'Hello World text!',
    html_content: '<h1>Hello World!</h1>',
    attachments: [{
        fileName: "HelloWorld.txt",
        contentType: "text/plain",
        content: "SGVsbG8gV29ybGQh\n"
    }]
};
var messageObj = pauboxjs.message(options);

service.sendMessage(messageObj).then(function (response) {
    console.log("Send Message method Response: " + JSON.stringify(response));
    service.getEmailDisposition(response.sourceTrackingId).then(function (response) {
        console.log("Get Email Disposition method Response: " + JSON.stringify(response));
    }).catch(function (error) {
        console.log("Error in Get Email Disposition method: " + JSON.stringify(error));
    });
}).catch(function (error) {
    console.log("Error in Send Message method: " + JSON.stringify(error));
});