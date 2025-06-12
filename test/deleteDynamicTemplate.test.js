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

describe('emailService.deleteDynamicTemplate', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can delete a dynamic template', async function () {
    const templateId = 123;

    const validResponse = {
      "message": "Template test_template deleted!"
    };

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.deleteDynamicTemplate(templateId);
    expect(response).to.deep.equal(validResponse);
  });

  it('raises an error if the template is not found', async function () {
    const templateId = 123;

    const notFoundResponse = {
      "error": "Couldn't find DynamicTemplate with 'id'=123 [WHERE \"dynamic_templates\".\"api_customer_id\" = $1]"
    }

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: notFoundResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.deleteDynamicTemplate(templateId)).to.be.rejectedWith(notFoundResponse);
  });

  it('raises an error if an unexpected response is returned', async function () {
    const templateId = 123;

    const unexpectedResponse = {
      "this": "is not what we expected"
    }

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: unexpectedResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.deleteDynamicTemplate(templateId)).to.be.rejectedWith(unexpectedResponse);
  });
});
