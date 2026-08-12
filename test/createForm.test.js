const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const nock = require('nock');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const baseURL = 'https://forms.test';

const validAttributes = {
  title: 'Patient Intake',
  form_json: { fields: [{ label: 'First Name', type: 'text' }] },
  customer_id: 629,
  version: 1,
};

const createdResponse = { id: '550e8400-e29b-41d4-a716-446655440000' };

describe('formService.createForm', function () {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('can create a form', async function () {
    nock(baseURL).post('/api/forms', validAttributes).reply(200, createdResponse);

    const service = formService({ apiKey, baseURL });
    const response = await service.createForm(validAttributes);
    expect(response).to.deep.equal(createdResponse);
  });

  it('sends a Bearer Authorization header and only the allow-listed fields', async function () {
    const scope = nock(baseURL, {
      reqheaders: { authorization: 'Bearer ' + apiKey },
    })
      .post('/api/forms', validAttributes)
      .reply(200, createdResponse);

    const service = formService({ apiKey, baseURL });
    await service.createForm(Object.assign({ not_allowed: 'drop me' }, validAttributes));
    expect(scope.isDone()).to.equal(true);
  });

  it('throws before any request when a required field is missing', async function () {
    const service = formService({ apiKey, baseURL });
    for (const field of ['title', 'form_json', 'customer_id', 'version']) {
      const attrs = Object.assign({}, validAttributes);
      delete attrs[field];
      await expect(service.createForm(attrs)).to.be.rejectedWith(field + ' is required');
    }
  });

  it('throws before any request when formAttributes is not an object', async function () {
    const service = formService({ apiKey, baseURL });
    for (const bad of [null, 'a string', [1, 2], undefined]) {
      await expect(service.createForm(bad)).to.be.rejectedWith(
        'formAttributes is required and must be an object',
      );
    }
  });

  it('propagates the request error without leaking the Authorization header', async function () {
    nock(baseURL).post('/api/forms').reply(403, { detail: 'Forbidden' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.createForm(validAttributes);
    } catch (error) {
      caught = error;
    }

    expect(caught, 'expected createForm to reject').to.not.equal(undefined);
    expect(caught.response.status).to.equal(403);
    expect(caught.config.headers).to.not.have.property('Authorization');
    expect(JSON.stringify(caught)).to.not.contain(apiKey);
  });

  it('throws a shapeless-safe Error if an unexpected response is returned', async function () {
    nock(baseURL).post('/api/forms').reply(200, { no: 'id' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.createForm(validAttributes);
    } catch (error) {
      caught = error;
    }

    expect(caught).to.be.an.instanceof(Error);
    expect(caught.message).to.equal('Unexpected response from Forms API');
  });
});
