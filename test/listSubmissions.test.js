const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const nock = require('nock');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const baseURL = 'https://forms.test';
const formId = '550e8400-e29b-41d4-a716-446655440000';

const validSubmissionsResponse = {
  data: [{ id: 'b3b8c7e2-1d2f-4c5a-9e8d-7f6a5b4c3d2e', submitter_email: 'test@example.com' }],
  total: 1,
  page: 1,
  items: 50,
};

describe('formService.listSubmissions', function () {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('can list submissions', async function () {
    nock(baseURL)
      .get('/api/forms/' + formId + '/submissions')
      .reply(200, validSubmissionsResponse);

    const service = formService({ apiKey, baseURL });
    const response = await service.listSubmissions(formId);
    expect(response).to.deep.equal(validSubmissionsResponse);
  });

  it('sends the Bearer Authorization header and only the allow-listed query params', async function () {
    const scope = nock(baseURL, {
      reqheaders: { authorization: 'Bearer ' + apiKey },
    })
      .get('/api/forms/' + formId + '/submissions')
      .query({ order_by: 'submitter_email', order: 'asc', page: 1, items: 25 })
      .reply(200, validSubmissionsResponse);

    const service = formService({ apiKey, baseURL });
    await service.listSubmissions(formId, {
      order_by: 'submitter_email',
      order: 'asc',
      page: 1,
      items: 25,
      unknown_param: 'drop me',
    });
    expect(scope.isDone()).to.equal(true);
  });

  it('throws before any request when formId is not a UUID', async function () {
    const service = formService({ apiKey, baseURL });
    for (const bad of ['..', 'a?b=1', 'a#b', '', undefined]) {
      await expect(service.listSubmissions(bad)).to.be.rejectedWith(
        /formId (is required|must be a UUID)/,
      );
    }
  });

  it('propagates the request error without leaking the Authorization header', async function () {
    nock(baseURL)
      .get('/api/forms/' + formId + '/submissions')
      .reply(404, { detail: 'Not found' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.listSubmissions(formId);
    } catch (error) {
      caught = error;
    }

    expect(caught, 'expected listSubmissions to reject').to.not.equal(undefined);
    expect(caught.response.status).to.equal(404);
    expect(caught.config.headers).to.not.have.property('Authorization');
    expect(JSON.stringify(caught)).to.not.contain(apiKey);
  });
});
