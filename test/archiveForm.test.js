const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const nock = require('nock');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const baseURL = 'https://forms.test';
const formId = '550e8400-e29b-41d4-a716-446655440000';

const archivedResponse = { detail: 'Form archived.' };

describe('formService.archiveForm', function () {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('can archive a form', async function () {
    nock(baseURL)
      .post('/api/forms/' + formId + '/archive')
      .reply(200, archivedResponse);

    const service = formService({ apiKey, baseURL });
    const response = await service.archiveForm(formId);
    expect(response).to.deep.equal(archivedResponse);
  });

  it('sends a Bearer Authorization header and POSTs to the archive endpoint', async function () {
    const scope = nock(baseURL, {
      reqheaders: { authorization: 'Bearer ' + apiKey },
    })
      .post('/api/forms/' + formId + '/archive')
      .reply(200, archivedResponse);

    const service = formService({ apiKey, baseURL });
    await service.archiveForm(formId);
    expect(scope.isDone()).to.equal(true);
  });

  it('throws before any request when formId is not a UUID', async function () {
    const service = formService({ apiKey, baseURL });
    for (const bad of ['..', 'a?b=1', 'a#b', '', undefined]) {
      await expect(service.archiveForm(bad)).to.be.rejectedWith(
        /formId (is required|must be a UUID)/,
      );
    }
  });

  it('propagates the request error without leaking the Authorization header', async function () {
    nock(baseURL)
      .post('/api/forms/' + formId + '/archive')
      .reply(404, { detail: 'Not found' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.archiveForm(formId);
    } catch (error) {
      caught = error;
    }

    expect(caught, 'expected archiveForm to reject').to.not.equal(undefined);
    expect(caught.response.status).to.equal(404);
    expect(caught).to.not.have.property('config');
    expect(caught).to.not.have.property('request');
    expect(JSON.stringify(caught)).to.not.contain(apiKey);
  });
});
