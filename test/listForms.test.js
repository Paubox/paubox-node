const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const nock = require('nock');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const baseURL = 'https://forms.test';
const customerId = 629;

const validListResponse = {
  results: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Patient Intake Form',
      active: true,
      archived: false,
      submission_count: 42,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      title: 'Consent Form',
      active: false,
      archived: true,
      submission_count: 7,
    },
  ],
  page_info: { count: 2, pages: 1, page: 1, items: 50 },
};

describe('formService.listForms', function () {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('can list forms', async function () {
    nock(baseURL)
      .get('/api/forms')
      .query({ customer_id: customerId })
      .reply(200, validListResponse);

    const service = formService({ apiKey, baseURL });
    const response = await service.listForms({ customer_id: customerId });
    expect(response).to.deep.equal(validListResponse);
  });

  it('sends a Bearer Authorization header with the api key', async function () {
    const scope = nock(baseURL, {
      reqheaders: { authorization: 'Bearer ' + apiKey },
    })
      .get('/api/forms')
      .query({ customer_id: customerId })
      .reply(200, validListResponse);

    const service = formService({ apiKey, baseURL });
    await service.listForms({ customer_id: customerId });
    expect(scope.isDone()).to.equal(true);
  });

  it('sends only the allow-listed query params', async function () {
    const scope = nock(baseURL)
      .get('/api/forms')
      .query({
        customer_id: customerId,
        search: 'intake',
        order: 'asc',
        order_by: 'title',
        archived: 'false',
        page: 2,
        items: 25,
      })
      .reply(200, validListResponse);

    const service = formService({ apiKey, baseURL });
    await service.listForms({
      customer_id: customerId,
      search: 'intake',
      order: 'asc',
      order_by: 'title',
      archived: false,
      page: 2,
      items: 25,
      unknown_param: 'should not be sent',
    });
    expect(scope.isDone()).to.equal(true);
  });

  it('omits params that are null', async function () {
    const scope = nock(baseURL)
      .get('/api/forms')
      .query({ customer_id: customerId, page: 1 })
      .reply(200, validListResponse);

    const service = formService({ apiKey, baseURL });
    await service.listForms({ customer_id: customerId, search: null, page: 1 });
    expect(scope.isDone()).to.equal(true);
  });

  it('throws before any request when customer_id is missing', async function () {
    const service = formService({ apiKey, baseURL });
    await expect(service.listForms()).to.be.rejectedWith('customer_id is required');
    await expect(service.listForms({})).to.be.rejectedWith('customer_id is required');
    await expect(service.listForms({ search: 'x' })).to.be.rejectedWith('customer_id is required');
    // No nock interceptor was registered, so a leaked request would throw a
    // net-connect error instead of the assertion above.
  });

  it('throws an error if no apiKey was configured', async function () {
    const savedEnvKey = process.env.FORMS_API_KEY;
    delete process.env.FORMS_API_KEY;

    try {
      const service = formService({ baseURL });
      await expect(service.listForms({ customer_id: customerId })).to.be.rejectedWith(
        'apiKey is required for this method. Pass { apiKey } to formService() or set the FORMS_API_KEY environment variable.',
      );
    } finally {
      if (savedEnvKey !== undefined) {
        process.env.FORMS_API_KEY = savedEnvKey;
      }
    }
  });

  it('propagates the request error without leaking the Authorization header', async function () {
    nock(baseURL)
      .get('/api/forms')
      .query({ customer_id: customerId })
      .reply(401, { detail: 'Unauthorized' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.listForms({ customer_id: customerId });
    } catch (error) {
      caught = error;
    }

    expect(caught, 'expected listForms to reject').to.not.equal(undefined);
    expect(caught.response.status).to.equal(401);
    expect(caught.config.headers).to.not.have.property('Authorization');
    expect(JSON.stringify(caught)).to.not.contain(apiKey);
  });

  it('throws a shapeless-safe Error if an unexpected response is returned', async function () {
    nock(baseURL)
      .get('/api/forms')
      .query({ customer_id: customerId })
      .reply(200, { this: 'is not what we expected' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.listForms({ customer_id: customerId });
    } catch (error) {
      caught = error;
    }

    expect(caught).to.be.an.instanceof(Error);
    expect(caught.message).to.equal('Unexpected response from Forms API');
    // Body is reachable for debugging but not enumerable (so a logger that
    // stringifies the error can't spill response content).
    expect(Object.keys(caught)).to.not.include('body');
    expect(caught.body).to.deep.equal({ this: 'is not what we expected' });
  });
});
