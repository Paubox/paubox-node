const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const nock = require('nock');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const baseURL = 'https://forms.test';
const customerId = 629;

const statsResponse = {
  active_form_count: 3,
  total_submission_count: 128,
  submissions_last_7_days: 12,
};

describe('formService.getFormStats', function () {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('can get form stats', async function () {
    nock(baseURL).get('/api/forms/stats').reply(200, statsResponse);

    const service = formService({ apiKey, baseURL });
    const response = await service.getFormStats();
    expect(response).to.deep.equal(statsResponse);
  });

  it('sends a Bearer Authorization header and no customer_id when omitted', async function () {
    const scope = nock(baseURL, {
      reqheaders: { authorization: 'Bearer ' + apiKey },
    })
      .get('/api/forms/stats')
      .query({})
      .reply(200, statsResponse);

    const service = formService({ apiKey, baseURL });
    await service.getFormStats();
    expect(scope.isDone()).to.equal(true);
  });

  it('sends the customer_id query param when provided', async function () {
    const scope = nock(baseURL)
      .get('/api/forms/stats')
      .query({ customer_id: customerId })
      .reply(200, statsResponse);

    const service = formService({ apiKey, baseURL });
    await service.getFormStats(customerId);
    expect(scope.isDone()).to.equal(true);
  });

  it('propagates the request error without leaking the Authorization header', async function () {
    nock(baseURL).get('/api/forms/stats').query(true).reply(400, { detail: 'Bad request' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.getFormStats('not-numeric');
    } catch (error) {
      caught = error;
    }

    expect(caught, 'expected getFormStats to reject').to.not.equal(undefined);
    expect(caught.response.status).to.equal(400);
    expect(caught.config.headers).to.not.have.property('Authorization');
    expect(JSON.stringify(caught)).to.not.contain(apiKey);
  });

  it('throws a shapeless-safe Error if an unexpected response is returned', async function () {
    nock(baseURL).get('/api/forms/stats').query({}).reply(200, { unexpected: true });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.getFormStats();
    } catch (error) {
      caught = error;
    }

    expect(caught).to.be.an.instanceof(Error);
    expect(caught.message).to.equal('Unexpected response from Forms API');
  });
});
