const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const emailService = require('../src/service/emailService.js');

chai.use(chaiAsPromised);

const testCredentials = {
  apiKey: 'api-key-12345',
};

describe('emailService.listDynamicTemplates', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('can list dynamic templates', async function () {
    const templates = [
      {
        id: 123,
        api_customer_id: 12,
        name: 'test_template',
        body: '<p>Hello {{name}}</p>',
        metadata: null,
        created_at: '2026-10-13T17:02:11.123Z',
        updated_at: '2026-10-13T17:02:11.123Z',
      },
      {
        id: 124,
        api_customer_id: 12,
        name: 'test_template_2',
        body: '<p>Hello {{name}}</p>',
        metadata: null,
        created_at: '2026-10-13T17:02:11.123Z',
        updated_at: '2026-10-13T17:02:11.123Z',
      },
    ];

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: { templates },
      });
    });

    const service = emailService(testCredentials);
    const response = await service.listDynamicTemplates();
    expect(response).to.deep.equal(templates);
  });

  it('can list empty dynamic templates', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: { templates: [] },
      });
    });

    const service = emailService(testCredentials);
    const response = await service.listDynamicTemplates();
    expect(response).to.deep.equal([]);
  });

  it('still accepts the legacy bare-array response', async function () {
    const validResponse = [{ id: 123, name: 'test_template', api_customer_id: 12 }];

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: validResponse,
      });
    });

    const service = emailService(testCredentials);
    const response = await service.listDynamicTemplates();
    expect(response).to.deep.equal(validResponse);
  });

  it('raises the API response if the response is not an array', async function () {
    const invalidResponse = 'Too many templates';

    axiosStub = sinon.stub(axios, 'create').returns(function (_config) {
      return Promise.resolve({
        data: invalidResponse,
      });
    });

    const service = emailService(testCredentials);
    await expect(service.listDynamicTemplates()).to.be.rejectedWith(invalidResponse);
  });
});
