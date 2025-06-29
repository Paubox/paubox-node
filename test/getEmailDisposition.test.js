const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const emailService = require('../src/service/emailService.js');

chai.use(chaiAsPromised);

const testCredentials = {
  apiUsername: 'authorized_domain',
  apiKey: 'api-key-12345',
};

describe('emailService.getEmailDisposition', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can return a successful response with no message deliveries', async function () {
    const validSourceTrackingId = '6e1cf9a4-7bde-4834-8200-ed424b50c8a7';

    const validResponse = {
      sourceTrackingId: validSourceTrackingId,
      data: {
        message: {
          id: `${validSourceTrackingId}@authorized_domain.com`,
          message_deliveries: [],
        },
      },
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.getEmailDisposition(validSourceTrackingId);
    expect(response).to.deep.equal(validResponse);
  });

  it('can return a successful response with message deliveries', async function () {
    const validSourceTrackingId = '6e1cf9a4-7bde-4834-8200-ed424b50c8a7';

    const validResponse = {
      sourceTrackingId: validSourceTrackingId,
      data: {
        message: {
          id: `${validSourceTrackingId}@authorized_domain.com`,
          message_deliveries: [
            {
              recipient: 'recipient@host.com',
              status: {
                deliveryStatus: 'delivered',
                deliveryTime: 'Mon, 23 Apr 2018 13:27:34 -0700',
                openedStatus: 'opened',
                openedTime: 'Mon, 23 Apr 2018 13:27:51 -0700',
              },
            },
          ],
        },
      },
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.getEmailDisposition(validSourceTrackingId);
    expect(response).to.deep.equal(validResponse);
  });

  it('defaults all openedStatus to unopened', async function () {
    const validSourceTrackingId = '6e1cf9a4-7bde-4834-8200-ed424b50c8a7';

    const validResponse = {
      sourceTrackingId: validSourceTrackingId,
      data: {
        message: {
          id: `${validSourceTrackingId}@authorized_domain.com`,
          message_deliveries: [
            {
              recipient: 'recipient@host.com',
              status: {
                deliveryStatus: 'delivered',
                deliveryTime: 'Mon, 23 Apr 2018 13:27:34 -0700',
                openedStatus: null, // This should be defaulted to unopened
                openedTime: null,
              },
            },
          ],
        },
      },
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.getEmailDisposition(validSourceTrackingId);

    expect(response).to.deep.equal({
      sourceTrackingId: validSourceTrackingId,
      data: {
        message: {
          id: `${validSourceTrackingId}@authorized_domain.com`,
          message_deliveries: [
            {
              recipient: 'recipient@host.com',
              status: {
                deliveryStatus: 'delivered',
                deliveryTime: 'Mon, 23 Apr 2018 13:27:34 -0700',
                openedStatus: 'unopened', // This has been changed from null to unopened
                openedTime: null,
              },
            },
          ],
        },
      },
    });
  });

  it('raises the API response as an error if no data is returned from the Paubox API', async function () {
    const sourceTrackingId = '6e1cf9a4-7bde-4834-8200-ed424b50c8a7';

    const emptyResponse = {
      data: null,
      sourceTrackingId: null,
      errors: null,
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: emptyResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.getEmailDisposition(sourceTrackingId)).to.be.rejectedWith(emptyResponse);
  });

  it('can return an error response for a non-existent message (HTTP 404)', async function () {
    const invalidSourceTrackingId = 'this-message-does-not-exist';

    const notFoundResponse = {
      data: {
        errors: [
          {
            code: 404,
            title: 'Message was not found',
            details: 'Message with this tracking id was not found',
          },
        ],
        sourceTrackingId: invalidSourceTrackingId,
      },
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: notFoundResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.getEmailDisposition(invalidSourceTrackingId);

    expect(response).to.deep.equal(notFoundResponse);
  });
});
