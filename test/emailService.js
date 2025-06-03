import dotenv from 'dotenv';
dotenv.config();
import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import emailService from '../lib/service/emailService.js';
import message from '../lib/data/message.js';
import { readFileSync } from 'fs';
import Papa from 'papaparse';

const content = readFileSync('./test/SendMessage_TestData.csv', 'utf8');
// Papa Parse for parsing CSV Files
const sendCsvParsedData = Papa.parse(content);

const testCredentials = {
  apiUsername: 'authorized_domain',
  apiKey: 'api-key-12345',
};

const sourceTrackingId = '6e1cf9a4-7bde-4834-8200-ed424b50c8a7';

describe('emailService.GetEmailDisposition_ReturnSuccess', function () {
  let axiosStub;

  beforeEach(function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      return Promise.resolve({
        data: {
          "sourceTrackingId": sourceTrackingId,
          "data": {
            "message": {
              "id": `${sourceTrackingId}@authorized_domain.com`,
              "message_deliveries": [
                {
                  "recipient": "recipient@host.com",
                  "status": {
                    "deliveryStatus": "delivered",
                    "deliveryTime": "Mon, 23 Apr 2018 13:27:34 -0700",
                    "openedStatus": "opened",
                    "openedTime": "Mon, 23 Apr 2018 13:27:51 -0700"
                  }
                }
              ]
            }
          }
        }
      });
    });
  });

  afterEach(function () {
    axiosStub.restore();
  });

  it('returns a successful response', async function () {
    const service = emailService(testCredentials);
    const response = await service.getEmailDisposition(sourceTrackingId);
    passIfGetResponseIsSuccessful(response);
  });
});

describe('emailService.GetEmailDisposition_ReturnError', function () {
  let axiosStub;

  const notFoundSourceTrackingId = 'this-message-does-not-exist';

  beforeEach(function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      return Promise.resolve({
        data: {
          "errors": [
            {
              "code": 404,
              "title": "Message was not found",
              "details": "Message with this tracking id was not found"
            }
          ],
          "sourceTrackingId": notFoundSourceTrackingId
        }
      });
    });
  });

  afterEach(function () {
    axiosStub.restore();
  });

  it('returns an error response for non-existent message', async function () {
    const service = emailService(testCredentials);
    const response = await service.getEmailDisposition(notFoundSourceTrackingId);
    passIfGetResponseHasError(response);
  });
});

describe('emailService.SendMessage_ReturnSuccess', function () {
  this.timeout(4000);
  let apiResponse;
  const testData = getTestData(true);
  let i = 0;

  beforeEach(function (done) {
    // simulate async call w/ setTimeout
    setTimeout(function () {
      const service = emailService();
      service
        .sendMessage(testData[i])
        .then(function (response) {
          apiResponse = response;
          done();
        })
        .catch((error) => {
          apiResponse = error;
          done();
        });
    }, 100);
  });

  afterEach(function () {
    i = i + 1;
  });

  for (let k = 0; k < testData.length; k++) {
    it('should return successful response ' + (k + 1), function () {
      passIfPostResponseIsSuccessful(apiResponse);
    });
  }
});

describe('emailService.SendMessage_ReturnSuccess: Using Passed credentials as pauboxConfig', function () {
  this.timeout(4000);
  let apiResponse;
  const testData = getTestData(true);
  let i = 0;

  beforeEach(function (done) {
    // simulate async call w/ setTimeout
    setTimeout(function () {
      const service = emailService(testCredentials);
      service
        .sendMessage(testData[i])
        .then(function (response) {
          apiResponse = response;
          done();
        })
        .catch((error) => {
          apiResponse = error;
          done();
        });
    }, 100);
  });

  afterEach(function () {
    i = i + 1;
  });

  for (let k = 0; k < testData.length; k++) {
    it('should return successful response ' + (k + 1), function () {
      passIfPostResponseIsSuccessful(apiResponse);
    });
  }
});

describe('emailService.SendMessage_ReturnError', function () {
  this.timeout(4000);
  let apiResponse;
  const testData = getTestData(false);
  let i = 0;

  beforeEach(function (done) {
    // simulate async call w/ setTimeout
    setTimeout(function () {
      const service = emailService();
      service
        .sendMessage(testData[i])
        .then(function (response) {
          apiResponse = response;
          done();
        })
        .catch((error) => {
          apiResponse = error;
          done();
        });
    }, 100);
  });

  afterEach(function () {
    i = i + 1;
  });

  for (let k = 0; k < testData.length; k++) {
    it('should return error response ' + (k + 1), function () {
      passIfPostResponseHasError(apiResponse);
    });
  }
});

function getTestData(forSuccess) {
  const csvData = sendCsvParsedData.data;
  const arrMessages = [];

  for (let j = 1; j < csvData.length; j++) {
    const testMsgData = csvData[j];
    if (forSuccess) {
      if (testMsgData[15] !== 'SUCCESS') {
        // If Expected output is not Success , then skip the test data
        continue;
      }
    } else {
      if (testMsgData[15] !== 'ERROR') {
        // If Expected output is not Error , then skip the test data
        continue;
      }
    }

    const options = {
      from: testMsgData[4],
      to: [testMsgData[1]],
      cc: [testMsgData[14]],
      bcc: [testMsgData[2]],
      reply_to: testMsgData[5],
      subject: testMsgData[3],
      allowNonTLS: testMsgData[6].toLowerCase() === 'true' ? true : false,
      forceSecureNotification: testMsgData[13],
      text_content: testMsgData[7] !== null ? testMsgData[7] : null,
      html_content: testMsgData[8] !== null ? testMsgData[8] : null,
    };

    if (testMsgData[9] > 0) {
      const attachment = {};
      attachment.fileName = testMsgData[10];
      attachment.contentType = testMsgData[11];
      attachment.content = testMsgData[12];

      options.attachments = attachment;
    }

    const msg = message(options);
    arrMessages.push(msg);
  }
  return arrMessages;
}

function passIfGetResponseIsSuccessful(apiResponse) {
  if (
    apiResponse == null ||
    apiResponse.data == null ||
    apiResponse.data.message == null ||
    apiResponse.data.message.id == null
  ) {
    expect('Success').to.equal('Error');
  } else if (apiResponse.errors != null && apiResponse.errors.length > 0) {
    expect('Success').to.equal('Error');
  } else if (
    apiResponse.data.message.message_deliveries != null &&
    apiResponse.data.message.message_deliveries.length > 0
  ) {
    expect('Success').to.equal('Success');
  } else {
    expect('Success').to.equal('Error');
  }
}

function passIfGetResponseHasError(apiResponse) {
  if (apiResponse == null || apiResponse.errors == null || apiResponse.errors.length <= 0) {
    expect('Error').to.equal('Success');
  } else {
    if (apiResponse.errors[0].title == null) {
      expect('Error').to.equal('Success');
    } else {
      expect('Error').to.equal('Error');
    }
  }
}

function passIfPostResponseIsSuccessful(apiResponse) {
  if (apiResponse != null) {
    if (apiResponse.data != null && apiResponse.sourceTrackingId != null) {
      expect('Success').to.equal('Success');
    } else {
      expect('Success').to.equal('Error');
    }
  } else {
    expect('Success').to.equal('Error');
  }
}

function passIfPostResponseHasError(apiResponse) {
  if (apiResponse != null) {
    if (apiResponse.errors != null && apiResponse.errors.length > 0) {
      expect('Error').to.equal('Error');
    } else {
      expect('Error').to.equal('Success');
    }
  } else {
    expect('Error').to.equal('Success');
  }
}
