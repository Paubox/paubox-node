const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const nock = require('nock');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const baseURL = 'https://forms.test';
const formId = '550e8400-e29b-41d4-a716-446655440000';

const unarchivedResponse = { detail: 'Form unarchived.' };

describe('formService.unarchiveForm', function () {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('can unarchive a form', async function () {
    nock(baseURL)
      .post('/api/forms/' + formId + '/unarchive')
      .reply(200, unarchivedResponse);

    const service = formService({ apiKey, baseURL });
    const response = await service.unarchiveForm(formId);
    expect(response).to.deep.equal(unarchivedResponse);
  });

  it('sends a Bearer Authorization header and POSTs to the unarchive endpoint', async function () {
    const scope = nock(baseURL, {
      reqheaders: { authorization: 'Bearer ' + apiKey },
    })
      .post('/api/forms/' + formId + '/unarchive')
      .reply(200, unarchivedResponse);

    const service = formService({ apiKey, baseURL });
    await service.unarchiveForm(formId);
    expect(scope.isDone()).to.equal(true);
  });

  it('throws before any request when formId is not a UUID', async function () {
    const service = formService({ apiKey, baseURL });
    for (const bad of ['..', 'a?b=1', 'a#b', '', undefined]) {
      await expect(service.unarchiveForm(bad)).to.be.rejectedWith(
        /formId (is required|must be a UUID)/,
      );
    }
  });

  it('propagates the request error without leaking the Authorization header', async function () {
    nock(baseURL)
      .post('/api/forms/' + formId + '/unarchive')
      .reply(404, { detail: 'Not found' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.unarchiveForm(formId);
    } catch (error) {
      caught = error;
    }

    expect(caught, 'expected unarchiveForm to reject').to.not.equal(undefined);
    expect(caught.response.status).to.equal(404);
    expect(caught).to.not.have.property('config');
    expect(caught).to.not.have.property('request');
    expect(JSON.stringify(caught)).to.not.contain(apiKey);
  });
});
