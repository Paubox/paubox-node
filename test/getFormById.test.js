const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const nock = require('nock');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const baseURL = 'https://forms.test';
const formId = '550e8400-e29b-41d4-a716-446655440000';

const validForm = {
  id: formId,
  title: 'Patient Intake Form',
  active: false,
  archived: true,
};

describe('formService.getFormById', function () {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('can get a form by id, including archived and inactive forms', async function () {
    nock(baseURL)
      .get('/api/forms/' + formId)
      .reply(200, { data: validForm });

    const service = formService({ apiKey, baseURL });
    const response = await service.getFormById(formId);
    expect(response).to.deep.equal(validForm);
  });

  it('sends a Bearer Authorization header and requests the right url', async function () {
    const scope = nock(baseURL, {
      reqheaders: { authorization: 'Bearer ' + apiKey },
    })
      .get('/api/forms/' + formId)
      .reply(200, { data: validForm });

    const service = formService({ apiKey, baseURL });
    await service.getFormById(formId);
    expect(scope.isDone()).to.equal(true);
  });

  it('throws before any request when formId is not a UUID', async function () {
    const service = formService({ apiKey, baseURL });
    for (const bad of ['..', '../..', '..%2F..%2Fadmin', 'a?b=1', 'a#b', 'a b', '', undefined]) {
      await expect(service.getFormById(bad)).to.be.rejectedWith(
        /formId (is required|must be a UUID)/,
      );
    }
    // No nock interceptor is registered; a leaked request would surface as a
    // net-connect error, so these assertions prove no HTTP was attempted.
  });

  it('throws an error if no apiKey was configured', async function () {
    const savedEnvKey = process.env.FORMS_API_KEY;
    delete process.env.FORMS_API_KEY;

    try {
      const service = formService({ baseURL });
      await expect(service.getFormById(formId)).to.be.rejectedWith(
        'apiKey is required for this method.',
      );
    } finally {
      if (savedEnvKey !== undefined) {
        process.env.FORMS_API_KEY = savedEnvKey;
      }
    }
  });

  it('propagates the request error without leaking the Authorization header', async function () {
    nock(baseURL)
      .get('/api/forms/' + formId)
      .reply(404, { detail: 'Not found' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.getFormById(formId);
    } catch (error) {
      caught = error;
    }

    expect(caught, 'expected getFormById to reject').to.not.equal(undefined);
    expect(caught.response.status).to.equal(404);
    expect(caught).to.not.have.property('config');
    expect(caught).to.not.have.property('request');
    expect(JSON.stringify(caught)).to.not.contain(apiKey);
  });

  it('throws a shapeless-safe Error if the wrapped form has no id', async function () {
    nock(baseURL)
      .get('/api/forms/' + formId)
      .reply(200, { data: { title: 'no id here' } });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.getFormById(formId);
    } catch (error) {
      caught = error;
    }

    expect(caught).to.be.an.instanceof(Error);
    expect(caught.message).to.equal('Unexpected response from Forms API');
  });
});
