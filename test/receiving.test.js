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

function stubAxios(responseData) {
  return sinon.stub(axios, 'create').returns(function (_config) {
    return Promise.resolve({ data: responseData });
  });
}

describe('emailService receiving domains', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('listReceivingDomains returns domains', async function () {
    const domains = [{ id: 1, slug: 'example' }];
    axiosStub = stubAxios(domains);

    const service = emailService(testCredentials);
    const response = await service.listReceivingDomains();
    expect(response).to.deep.equal(domains);
  });

  it('createReceivingDomain sends slug', async function () {
    const created = { id: 1, slug: 'example' };
    axiosStub = stubAxios(created);

    const service = emailService(testCredentials);
    const response = await service.createReceivingDomain('example');
    expect(response).to.deep.equal(created);
  });

  it('createReceivingDomain works without slug', async function () {
    const created = { id: 2, slug: 'auto-generated' };
    axiosStub = stubAxios(created);

    const service = emailService(testCredentials);
    const response = await service.createReceivingDomain();
    expect(response).to.deep.equal(created);
  });

  it('getReceivingDomain returns a domain', async function () {
    const domain = { id: 1, slug: 'example', dns_records: [] };
    axiosStub = stubAxios(domain);

    const service = emailService(testCredentials);
    const response = await service.getReceivingDomain(1);
    expect(response).to.deep.equal(domain);
  });

  it('deleteReceivingDomain returns success', async function () {
    const result = { message: 'Domain deleted' };
    axiosStub = stubAxios(result);

    const service = emailService(testCredentials);
    const response = await service.deleteReceivingDomain(1);
    expect(response).to.deep.equal(result);
  });
});

describe('emailService receiving mailboxes', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('listReceivingMailboxes returns mailboxes', async function () {
    const mailboxes = [{ id: 1, name: 'inbox' }];
    axiosStub = stubAxios(mailboxes);

    const service = emailService(testCredentials);
    const response = await service.listReceivingMailboxes(1);
    expect(response).to.deep.equal(mailboxes);
  });

  it('createReceivingMailbox sends name and password', async function () {
    const created = { id: 1, name: 'user1' };
    axiosStub = stubAxios(created);

    const service = emailService(testCredentials);
    const response = await service.createReceivingMailbox(1, 'user1', 'pass123');
    expect(response).to.deep.equal(created);
  });

  it('createReceivingMailbox includes quota_bytes when provided', async function () {
    const created = { id: 1, name: 'user1', quota_bytes: 1073741824 };
    axiosStub = stubAxios(created);

    const service = emailService(testCredentials);
    const response = await service.createReceivingMailbox(1, 'user1', 'pass123', 1073741824);
    expect(response).to.deep.equal(created);
  });

  it('getReceivingMailbox returns a mailbox', async function () {
    const mailbox = { id: 1, name: 'user1', quota_bytes: 1073741824 };
    axiosStub = stubAxios(mailbox);

    const service = emailService(testCredentials);
    const response = await service.getReceivingMailbox(1, 1);
    expect(response).to.deep.equal(mailbox);
  });

  it('deleteReceivingMailbox returns success', async function () {
    const result = { message: 'Mailbox deleted' };
    axiosStub = stubAxios(result);

    const service = emailService(testCredentials);
    const response = await service.deleteReceivingMailbox(1, 1);
    expect(response).to.deep.equal(result);
  });
});

describe('emailService received emails', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('listReceivedEmails returns emails', async function () {
    const emails = { data: [{ id: 'abc123' }] };
    axiosStub = stubAxios(emails);

    const service = emailService(testCredentials);
    const response = await service.listReceivedEmails();
    expect(response).to.deep.equal(emails);
  });

  it('listReceivedEmails passes query params', async function () {
    const emails = { data: [{ id: 'abc123' }] };
    axiosStub = stubAxios(emails);

    const service = emailService(testCredentials);
    const response = await service.listReceivedEmails({
      limit: 10,
      after: 'cursor1',
      before: 'cursor2',
    });
    expect(response).to.deep.equal(emails);
  });

  it('getReceivedEmail returns an email', async function () {
    const email = { id: 'abc123', subject: 'Hello', from: 'sender@example.com' };
    axiosStub = stubAxios(email);

    const service = emailService(testCredentials);
    const response = await service.getReceivedEmail('abc123');
    expect(response).to.deep.equal(email);
  });

  it('getReceivedEmailAttachment returns attachment data', async function () {
    const attachment = { content: 'base64data', content_type: 'application/pdf' };
    axiosStub = stubAxios(attachment);

    const service = emailService(testCredentials);
    const response = await service.getReceivedEmailAttachment('abc123', 'blob456');
    expect(response).to.deep.equal(attachment);
  });
});
