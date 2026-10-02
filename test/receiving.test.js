const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');
const nock = require('nock');

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

const emailId = '0b6f3c2e-8d4a-4f1e-9c7b-2a5d6e8f9a01';
const attachmentId = '7c1e9a4b-3f2d-4e8a-b6c5-1d0f2e3a4b5c';

const address = { name: 'Sender', address: 'sender@example.com' };
const recipient = { name: null, address: 'inbox@acme.paubox.email' };

const attachment = {
  id: attachmentId,
  filename: 'report.pdf',
  content_type: 'application/pdf',
  size: 12345,
  content_id: null,
  download_url: `https://api.paubox.com/v1/email/receiving/${emailId}/attachments/${attachmentId}`,
};

const listItem = {
  email_id: emailId,
  from: [address],
  to: [recipient],
  subject: 'Hello',
  received_at: '2026-10-01T12:00:00Z',
  has_attachment: true,
  spam: false,
  size: 20480,
  domain: 'acme.paubox.email',
};

const detail = {
  email_id: emailId,
  from: [address],
  to: [recipient],
  cc: [],
  subject: 'Hello',
  date: '2026-10-01T11:59:58Z',
  received_at: '2026-10-01T12:00:00Z',
  message_id: ['<abc@example.com>'],
  in_reply_to: null,
  references: null,
  spam: false,
  spam_score: 0.1,
  text_body: 'Hi there',
  html_body: '<p>Hi there</p>',
  attachments: [attachment],
  size: 20480,
  authentication: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
  domain: 'acme.paubox.email',
  headers: [{ name: 'Subject', value: 'Hello' }],
};

function captureAxios(responseData) {
  const calls = [];
  const stub = sinon.stub(axios, 'create').callsFake(function (instanceConfig) {
    return function (config) {
      calls.push({ instanceConfig, config });
      return Promise.resolve({ data: responseData });
    };
  });
  return { stub, calls };
}

describe('emailService received emails', function () {
  let axiosStub;

  this.afterEach(() => {
    axiosStub.restore();
  });

  it('listReceivedEmails returns the list envelope', async function () {
    const list = { object: 'list', data: [listItem], has_more: false };
    const { stub, calls } = captureAxios(list);
    axiosStub = stub;

    const service = emailService(testCredentials);
    const response = await service.listReceivedEmails();

    expect(response).to.deep.equal(list);
    expect(calls[0].config.method).to.equal('GET');
    expect(calls[0].config.url).to.equal('/receiving');
  });

  it('listReceivedEmails passes pagination, search and sort params', async function () {
    const list = { object: 'list', data: [listItem], has_more: true };
    const { stub, calls } = captureAxios(list);
    axiosStub = stub;

    const service = emailService(testCredentials);
    const response = await service.listReceivedEmails({
      limit: 10,
      after: emailId,
      before: attachmentId,
      search: 'invoice',
      sort: 'received_at',
      ascending: true,
    });

    expect(response).to.deep.equal(list);
    const url = new URL(calls[0].config.url, 'https://api.paubox.com');
    expect(url.pathname).to.equal('/receiving');
    expect(Object.fromEntries(url.searchParams)).to.deep.equal({
      limit: '10',
      after: emailId,
      before: attachmentId,
      search: 'invoice',
      sort: 'received_at',
      ascending: 'true',
    });
  });

  it('listReceivedEmails sends ascending=false when explicitly false', async function () {
    const { stub, calls } = captureAxios({ object: 'list', data: [], has_more: false });
    axiosStub = stub;

    const service = emailService(testCredentials);
    await service.listReceivedEmails({ ascending: false });

    expect(calls[0].config.url).to.equal('/receiving?ascending=false');
  });

  it('getReceivedEmail returns the email detail by email_id', async function () {
    const { stub, calls } = captureAxios({ data: detail });
    axiosStub = stub;

    const service = emailService(testCredentials);
    const response = await service.getReceivedEmail(emailId);

    expect(response).to.deep.equal({ data: detail });
    expect(calls[0].config.url).to.equal(`/receiving/${emailId}`);
  });
});

describe('emailService.getReceivedEmailAttachment', function () {
  const baseURL = 'https://api.paubox.com';
  const path = `/v1/email/receiving/${emailId}/attachments/${attachmentId}`;
  const bytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00, 0xff, 0xfe, 0x80, 0x0a]);

  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('returns the raw bytes as a Buffer with content type and filename', async function () {
    nock(baseURL)
      .get(path)
      .matchHeader('Authorization', `Token token=${testCredentials.apiKey}`)
      .reply(200, bytes, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="report.pdf"',
      });

    const service = emailService(testCredentials);
    const response = await service.getReceivedEmailAttachment(emailId, attachmentId);

    expect(Buffer.isBuffer(response.content)).to.equal(true);
    expect(response.content.equals(bytes)).to.equal(true);
    expect(response.content_type).to.equal('application/pdf');
    expect(response.filename).to.equal('report.pdf');
  });

  it('returns a null filename when Content-Disposition has none', async function () {
    nock(baseURL).get(path).reply(200, bytes, {
      'Content-Type': 'text/html',
      'Content-Disposition': 'attachment',
    });

    const service = emailService(testCredentials);
    const response = await service.getReceivedEmailAttachment(emailId, attachmentId);

    expect(response.content.equals(bytes)).to.equal(true);
    expect(response.content_type).to.equal('text/html');
    expect(response.filename).to.equal(null);
  });

  it('parses an unquoted filename', async function () {
    nock(baseURL).get(path).reply(200, bytes, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename=data.bin',
    });

    const service = emailService(testCredentials);
    const response = await service.getReceivedEmailAttachment(emailId, attachmentId);

    expect(response.filename).to.equal('data.bin');
  });

  it('rejects with the decoded JSON error body on 404', async function () {
    nock(baseURL).get(path).reply(404, { error: 'attachment not found' });

    const service = emailService(testCredentials);
    const error = await service.getReceivedEmailAttachment(emailId, attachmentId).then(
      () => null,
      (err) => err,
    );

    expect(error).to.not.equal(null);
    expect(error.response.status).to.equal(404);
    expect(error.response.data).to.deep.equal({ error: 'attachment not found' });
  });
});
