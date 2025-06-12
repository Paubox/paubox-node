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

describe('emailService.getDynamicTemplate', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can get a dynamic template', async function () {
    const templateId = 123;

    const validResponse = {
      "id": templateId,
      "name": "test_template",
      "api_customer_id": 12,
      "body": "<html><body><p>Hello {{first_name}} {{last_name}}!</p></body></html>",
      "created_at": "2025-06-12T02:05:39.447-07:00",
      "updated_at": "2025-06-12T02:05:39.447-07:00",
      "metadata": {}
    }

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.getDynamicTemplate(templateId);
    expect(response).to.deep.equal(validResponse);
  });

  it('raises an error if the template is not found', async function () {
    const templateId = 123;

    const pauboxResponse = {
      "error": "Couldn't find DynamicTemplate with 'id'=123 [WHERE \"dynamic_templates\".\"api_customer_id\" = $1]"
    }

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: pauboxResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.getDynamicTemplate(templateId)).to.be.rejectedWith(pauboxResponse.error);
  });

  it('raises an error if an invalid template id is used', async function () {
    const templateId = "     123  ";

    const pauboxResponse = {
      "error": "Couldn't find DynamicTemplate with 'id'=     123   [WHERE \"dynamic_templates\".\"api_customer_id\" = $1]"
    }

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: pauboxResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.getDynamicTemplate(templateId)).to.be.rejectedWith(pauboxResponse.error);
  });

  it('raises the API response as an error if an unexpected response is returned', async function () {
    const templateId = 123;

    const pauboxResponse = {
      "this": "is not what we expected"
    }

    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: pauboxResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.getDynamicTemplate(templateId)).to.be.rejectedWith(pauboxResponse);
  });
});
