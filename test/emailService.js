"use strict";

require("dotenv").config();

const expect = require("chai").expect;
const assert = require("chai").assert;
const emailService = require("../lib/service/emailService.js");

describe("emailService.GetEmailDisposition_ReturnSuccess", function () {
    this.timeout(3000);
    var apiResponse;
    var testData = [
        "1aed91d1-f7ce-4c3d-8df2-85ecd225a7fc",
        "31b23486-9340-4b34-b313-44ee1109bb57",
    ];
    var i = 0;


    beforeEach(function (done) {

        // simulate async call w/ setTimeout
        setTimeout(function () {

            let service = emailService();
            service.getEmailDisposition(testData[i])
                .then(function (response, error, data) {
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

    it("should return successful response", function () {

        if (apiResponse == null || apiResponse.data == null || apiResponse.data.message == null || apiResponse.data.message.id == null)
            expect("Success").to.equal("Error");
        else if (apiResponse.errors != null && apiResponse.errors.length > 0) {
            expect("Success").to.equal("Error");
        } else if (apiResponse.data.message.message_deliveries != null && apiResponse.data.message.message_deliveries.length > 0) {
            expect("Success").to.equal("Success");
        } else {
            expect("Success").to.equal("Error");
        }



    });


    it("should return successful response 2", function () {

        if (apiResponse == null || apiResponse.data == null || apiResponse.data.message == null || apiResponse.data.message.id == null)
            expect("Success").to.equal("Error");
        else if (apiResponse.errors != null && apiResponse.errors.length > 0) {
            expect("Success").to.equal("Error");
        } else if (apiResponse.data.message.message_deliveries != null && apiResponse.data.message.message_deliveries.length > 0) {
            expect("Success").to.equal("Success");
        } else {
            expect("Success").to.equal("Error");
        }



    });




});
