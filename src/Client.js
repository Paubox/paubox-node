require("dotenv").config();
const config = require("../test/data/config.js");
const emailService = require("../lib/service/emailService.js");
const message = require("../lib/data/message.js");

let service = emailService(config);

let options = {
    from: 'renee@undefeatedgames.com',
    to: ['vighneshtrivedi2004@gmail.com'],
    bcc: ['vighneshtrivedi2004@gmail.com'],
    reply_to: 'renee@undefeatedgames.com',
    subject: 'Testing from NodeJs',
    //allowNonTLS: true,
    text_content: 'Hello World text!',
    html_content: '<h1>Hello World!</h1>',
    attachments: [
        {
            fileName: "HelloWorld.txt",
            contentType: "text/plain",
            content: "SGVsbG8gV29ybGQh\n",
        }
    ]
}

service.getEmailDisposition("31b23486-9340-4b34-b313-44ee1109bb57")
            .then(response => {
                var dataJson = JSON.stringify(response);
                console.log("Response: " + dataJson);
            }
            ).catch(error => {
                var dataJson = JSON.stringify(error);
                console.log("Error: " + error);
            });

var msg = message(options);
var resp = service.sendMessage(msg)
    .then(response => {
        var dataJson = JSON.stringify(response);
        console.log("Post Response: " + dataJson);
    }
    ).catch(error => {
        var dataJson = JSON.stringify(error);
        console.log("Post Error: " + error);
    });

