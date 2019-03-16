"use strict";

require("dotenv").config();
const expect = require("chai").expect;
const emailService = require("../lib/service/emailService.js");
var message = require("../lib/data/message.js");
var fs = require('fs');
var content = fs.readFileSync("./test/SendMessage_TestData.csv", "utf8");

// Papa Parse for parsing CSV Files
var Papa = require('papaparse');
var sendCsvParsedData = Papa.parse(content);

const pauboxConfig = {
    apiUsername: 'your-api-username',
    apiKey: 'your-api-key',
  };

describe("emailService.GetEmailDisposition_ReturnSuccess", function () {
    this.timeout(4000);
    var apiResponse;
    var testData = [
        "f0777ce7-bd6b-4a49-ab58-91e0cacbc642",
        "0c1cf5ae-34ea-4694-b42b-3e0ac6906cdd"
    ];
    var i = 0;

    beforeEach(function (done) {

        // simulate async call w/ setTimeout
        setTimeout(function () {

            let service = emailService();
            service.getEmailDisposition(testData[i])
                .then(function (response) {
                    apiResponse = response;
                    done();
                })
                .catch(error => {
                    apiResponse = error;
                    done();
                });
        }, 100);
    });

    afterEach(function () {
        i = i + 1;
    });

    for (var k = 0; k < testData.length; k++) {
        it("should return successful response " + (k + 1), function () {
            passIfGetResponseIsSuccessful(apiResponse);
        });
    }
});

describe("emailService.GetEmailDisposition_ReturnError", function () {
    this.timeout(3000);
    var apiResponse;
    var testData = [
        null,
        "",
        " ",
        "151515215"
    ];
    var i = 0;

    beforeEach(function (done) {

        // simulate async call w/ setTimeout
        setTimeout(function () {

            let service = emailService();
            service.getEmailDisposition(testData[i])
                .then(function (response) {
                    apiResponse = response;
                    done();
                })
                .catch(error => {
                    apiResponse = error;
                    done();
                });
        }, 100);
    });

    afterEach(function () {
        i = i + 1;
    });

    for (var k = 0; k < testData.length; k++) {
        it("should return error response " + (k + 1), function () {
            passIfGetResponseHasError(apiResponse);
        });
    }

});

describe("emailService.SendMessage_ReturnSuccess", function () {
    this.timeout(4000);
    var apiResponse;
    var testData = sendMessage_TestData(true);
    var i = 0;

    beforeEach(function (done) {

        // simulate async call w/ setTimeout
        setTimeout(function () {

            let service = emailService();
            service.sendMessage(testData[i])
                .then(function (response) {
                    apiResponse = response;
                    done();
                })
                .catch(error => {
                    apiResponse = error;
                    done();
                });
        }, 100);
    });

    afterEach(function () {
        i = i + 1;
    });

    for (var k = 0; k < testData.length; k++)
        it("should return successful response " + (k + 1), function () {
            passIfPostResponseIsSuccessful(apiResponse);
        });
});

describe("emailService.SendMessage_ReturnSuccess: Using Passed credentials as pauboxConfig", function () {
    this.timeout(4000);
    var apiResponse;
    var testData = sendMessage_TestData(true);
    var i = 0;

    beforeEach(function (done) {

        // simulate async call w/ setTimeout
        setTimeout(function () {           
            let service = emailService(pauboxConfig);
            service.sendMessage(testData[i])
                .then(function (response) {
                    apiResponse = response;                    
                    done();
                })
                .catch(error => {
                    apiResponse = error;
                    done();
                });
        }, 100);
    });

    afterEach(function () {
        i = i + 1;
    });

    for (var k = 0; k < testData.length; k++)
        it("should return successful response " + (k + 1), function () {
            passIfPostResponseIsSuccessful(apiResponse);
        });
});

describe("emailService.SendMessage_ReturnError", function () {
    this.timeout(4000);
    var apiResponse;
    var testData = sendMessage_TestData(false)
    var i = 0;

    beforeEach(function (done) {

        // simulate async call w/ setTimeout
        setTimeout(function () {

            let service = emailService();
            service.sendMessage(testData[i])
                .then(function (response) {
                    apiResponse = response;
                    done();
                })
                .catch(error => {
                    apiResponse = error;
                    done();
                });
        }, 100);
    });

    afterEach(function () {
        i = i + 1;
    });

    for (var k = 0; k < testData.length; k++)
        it("should return error response " + (k + 1), function () {
            passIfPostResponseHasError(apiResponse);
        });
});

function sendMessage_TestData(forSuccess) {
    var csvData = sendCsvParsedData.data;
    var arrMessages = [];

    for (var j = 1; j < csvData.length; j++) {

        var testMsgData = csvData[j];
        if (forSuccess) {
            if (testMsgData[13] != 'SUCCESS') // If Expected output is not Success , then skip the test data
                continue;
        }
        else {
            if (testMsgData[13] != 'ERROR')   // If Expected output is not Error , then skip the test data
                continue;
        }

        var options = {
            from: testMsgData[4],
            to: [testMsgData[1]],
            bcc: [testMsgData[2]],
            reply_to: testMsgData[5],
            subject: testMsgData[3],
            allowNonTLS: testMsgData[6].toLowerCase() == 'true' ? true : false,
            text_content: testMsgData[7] != null ? testMsgData[7] : null,
            html_content: testMsgData[8] != null ? testMsgData[8] : null
        };

        if (testMsgData[9] > 0) {

            var attachment = {};
            attachment.fileName = testMsgData[10];
            attachment.contentType = testMsgData[11];
            attachment.content = testMsgData[12];

            options.attachments = attachment;
        }

        var msg = message(options);
        arrMessages.push(msg);
    }
    return arrMessages;
}

function passIfGetResponseIsSuccessful(apiResponse) {
    if (apiResponse == null || apiResponse.data == null || apiResponse.data.message == null || apiResponse.data.message.id == null)
        expect("Success").to.equal("Error");
    else if (apiResponse.errors != null && apiResponse.errors.length > 0) {
        expect("Success").to.equal("Error");
    }
    else if (apiResponse.data.message.message_deliveries != null && apiResponse.data.message.message_deliveries.length > 0) {
        expect("Success").to.equal("Success");
    }
    else {
        expect("Success").to.equal("Error");
    }
}

function passIfGetResponseHasError(apiResponse) {
    if (apiResponse == null || apiResponse.errors == null || apiResponse.errors.length <= 0)
        expect("Error").to.equal("Success");
    else {
        if (apiResponse.errors[0].title == null) {
            expect("Error").to.equal("Success");
        }
        else {
            expect("Error").to.equal("Error");
        }
    }
}


function passIfPostResponseIsSuccessful(apiResponse) {
    if (apiResponse != null) {
        if (apiResponse.data != null && apiResponse.sourceTrackingId != null) {
            expect("Success").to.equal("Success");
        }
        else {
            expect("Success").to.equal("Error");
        }
    }
    else {
        expect("Success").to.equal("Error");
    }
}

function passIfPostResponseHasError(apiResponse) {
    if (apiResponse != null) {
        if (apiResponse.errors != null && apiResponse.errors.length > 0) {
            expect("Error").to.equal("Error");
        }
        else {
            expect("Error").to.equal("Success");
        }
    }
    else {
        expect("Error").to.equal("Success");
    }
}

