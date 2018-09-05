require("dotenv").config();
const config = require("../test/data/config.js");
var emailService = require("../lib/service/emailService.js");
const getEmailDispositionResponse = require("./data/CommonClasses.js");

let service = emailService(config);

// let options = {
//     from: 'you@yourdomain.com',
//     to: 'someone@domain.com, someone-else@domain.com',
//     bcc: ['another@domain.com', 'yet-another@domain.com'],    
//     reply_to: 'reply-to@yourdomain.com',
//     subject: 'Testing!',
//     text_content: 'Hello World!',
//     html_content: '<h1>Hello World!</h1>',
//     attachments: [ 
//             {
//                 fileName : "HelloWorld.txt",
//                 ContentType : "HelloWorld.txt",
//                 fileName : "HelloWorld.txt",
//             }
//         ]
// }



service.getEmailDisposition("3b5c7b9e-32d6-41c3-9058-06eb2ca5073b")
    .then(response => {
        var apiResponse = getEmailDispositionResponse(response);
        var dataJson = JSON.stringify(response);
        console.log("Response: " + dataJson);
    }
    ).catch(error => {
        var apiError = getEmailDispositionResponse(error);
        var dataJson = JSON.stringify(apiError);
        console.log("Error: " + apiError);
    });
