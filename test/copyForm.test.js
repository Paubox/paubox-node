const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const nock = require('nock');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const baseURL = 'https://forms.test';
const formId = '550e8400-e29b-41d4-a716-446655440000';
const title = 'Patient Intake (copy)';

const copiedResponse = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  title: title,
  vanity_url: null,
  submission_count: 0,
};

describe('formService.copyForm', function () {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('can copy a form', async function () {
    nock(baseURL)
      .post('/api/forms/copy', { form_id: formId, title: title })
      .reply(200, copiedResponse);

    const service = formService({ apiKey, baseURL });
    const response = await service.copyForm(formId, title);
    expect(response).to.deep.equal(copiedResponse);
  });

  it('sends a Bearer Authorization header and the documented body', async function () {
    const scope = nock(baseURL, {
      reqheaders: { authorization: 'Bearer ' + apiKey },
    })
      .post('/api/forms/copy', { form_id: formId, title: title })
      .reply(200, copiedResponse);

    const service = formService({ apiKey, baseURL });
    await service.copyForm(formId, title);
    expect(scope.isDone()).to.equal(true);
  });

  it('throws before any request when formId or title is missing', async function () {
    const service = formService({ apiKey, baseURL });
    await expect(service.copyForm('', title)).to.be.rejectedWith('formId is required');
    await expect(service.copyForm(undefined, title)).to.be.rejectedWith('formId is required');
    await expect(service.copyForm(formId, '')).to.be.rejectedWith('title is required');
    await expect(service.copyForm(formId, undefined)).to.be.rejectedWith('title is required');
  });

  it('propagates the request error without leaking the Authorization header', async function () {
    nock(baseURL).post('/api/forms/copy').reply(404, { detail: 'Not found' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.copyForm(formId, title);
    } catch (error) {
      caught = error;
    }

    expect(caught, 'expected copyForm to reject').to.not.equal(undefined);
    expect(caught.response.status).to.equal(404);
    expect(caught.config.headers).to.not.have.property('Authorization');
    expect(JSON.stringify(caught)).to.not.contain(apiKey);
  });

  it('throws a shapeless-safe Error if an unexpected response is returned', async function () {
    nock(baseURL).post('/api/forms/copy').reply(200, { no: 'id' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.copyForm(formId, title);
    } catch (error) {
      caught = error;
    }

    expect(caught).to.be.an.instanceof(Error);
    expect(caught.message).to.equal('Unexpected response from Forms API');
  });
});
