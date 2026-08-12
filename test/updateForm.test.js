const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const nock = require('nock');

const formService = require('../src/service/formService.js');

chai.use(chaiAsPromised);

const apiKey = 'test-scoped-api-key';
const baseURL = 'https://forms.test';
const formId = '550e8400-e29b-41d4-a716-446655440000';

const updatedResponse = { detail: 'Form updated.', form_id: formId };

describe('formService.updateForm', function () {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('can update a form', async function () {
    nock(baseURL)
      .put('/api/forms/' + formId, { title: 'New title' })
      .reply(200, updatedResponse);

    const service = formService({ apiKey, baseURL });
    const response = await service.updateForm(formId, { title: 'New title' });
    expect(response).to.deep.equal(updatedResponse);
  });

  it('sends a Bearer Authorization header and PUTs only the allow-listed keys', async function () {
    const scope = nock(baseURL, {
      reqheaders: { authorization: 'Bearer ' + apiKey },
    })
      .put('/api/forms/' + formId, {
        title: 'New title',
        description: 'New desc',
        active: false,
      })
      .reply(200, updatedResponse);

    const service = formService({ apiKey, baseURL });
    await service.updateForm(formId, {
      title: 'New title',
      description: 'New desc',
      active: false,
      not_allowed: 'drop me',
    });
    expect(scope.isDone()).to.equal(true);
  });

  it('does not send vanity_url (dropped from the updatable set)', async function () {
    // vanity_url is accepted-but-not-persisted server-side, so the SDK no
    // longer forwards it. With only vanity_url provided, no updatable field
    // remains and the call must throw before any request.
    const service = formService({ apiKey, baseURL });
    await expect(service.updateForm(formId, { vanity_url: 'my-form' })).to.be.rejectedWith(
      'updates must include at least one updatable field',
    );
  });

  it('throws before any request when formId is not a UUID', async function () {
    const service = formService({ apiKey, baseURL });
    for (const bad of ['..', 'a?b=1', 'a#b', '', undefined]) {
      await expect(service.updateForm(bad, { title: 'x' })).to.be.rejectedWith(
        /formId (is required|must be a UUID)/,
      );
    }
  });

  it('throws before any request when updates is empty or not an object', async function () {
    const service = formService({ apiKey, baseURL });
    await expect(service.updateForm(formId, { bogus_key: 'anything' })).to.be.rejectedWith(
      'updates must include at least one updatable field',
    );
    for (const bad of [null, 'x', [1, 2]]) {
      await expect(service.updateForm(formId, bad)).to.be.rejectedWith(
        'updates is required and must be an object',
      );
    }
  });

  it('propagates the request error without leaking the Authorization header', async function () {
    nock(baseURL)
      .put('/api/forms/' + formId)
      .reply(404, { detail: 'Not found' });

    const service = formService({ apiKey, baseURL });
    let caught;
    try {
      await service.updateForm(formId, { title: 'x' });
    } catch (error) {
      caught = error;
    }

    expect(caught, 'expected updateForm to reject').to.not.equal(undefined);
    expect(caught.response.status).to.equal(404);
    expect(caught.config.headers).to.not.have.property('Authorization');
    expect(JSON.stringify(caught)).to.not.contain(apiKey);
  });
});
