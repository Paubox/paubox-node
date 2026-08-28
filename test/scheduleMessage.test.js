const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');

const emailService = require('../src/service/emailService.js');
const Message = require('../src/data/message.js');

chai.use(chaiAsPromised);

const testCredentials = {
  apiKey: 'api-key-12345',
};

const message = Message({
  from: 'sender@authorized_domain.com',
  to: ['recipient@example.com'],
  subject: 'Scheduled Email',
  text_content: 'Hello world!',
});

describe('emailService.scheduleMessage', function () {
  let axiosStub;

  afterEach(() => {
    axiosStub.restore();
  });

  it('posts to /schedule with correct payload', async function () {
    let capturedConfig;
    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: {
          sourceTrackingId: 'tracking-id',
          scheduledAt: '2025-12-25T15:00:00Z',
          state: 'pending',
          data: 'Service OK',
        },
      });
    });

    const service = emailService(testCredentials);
    await service.scheduleMessage(message, '2025-12-25T15:00:00Z');

    expect(capturedConfig.method).to.equal('POST');
    expect(capturedConfig.url).to.equal('/schedule');
    expect(capturedConfig.data.data.scheduled_at).to.equal('2025-12-25T15:00:00Z');
    expect(capturedConfig.data.data.message).to.exist;
  });

  it('throws if message is missing', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function () {
      return Promise.resolve({ data: {} });
    });
    const service = emailService(testCredentials);
    await expect(service.scheduleMessage(null, '2025-12-25T15:00:00Z')).to.be.rejectedWith(
      'Message must implement toJSON()',
    );
  });

  it('throws if scheduledAt is missing', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function () {
      return Promise.resolve({ data: {} });
    });
    const service = emailService(testCredentials);
    await expect(service.scheduleMessage(message, null)).to.be.rejectedWith(
      'scheduledAt is required',
    );
  });
});

describe('emailService.getScheduledMessage', function () {
  let axiosStub;

  afterEach(() => {
    axiosStub.restore();
  });

  it('gets /schedule/:sourceTrackingId', async function () {
    let capturedConfig;
    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: {
          sourceTrackingId: 'tracking-id',
          scheduledAt: '2025-12-25T15:00:00Z',
          state: 'pending',
        },
      });
    });

    const service = emailService(testCredentials);
    const response = await service.getScheduledMessage('tracking-id');

    expect(capturedConfig.method).to.equal('GET');
    expect(capturedConfig.url).to.equal('/schedule/tracking-id');
    expect(response.state).to.equal('pending');
  });

  it('throws if sourceTrackingId is missing', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function () {
      return Promise.resolve({ data: {} });
    });
    const service = emailService(testCredentials);
    await expect(service.getScheduledMessage(null)).to.be.rejectedWith(
      'sourceTrackingId is required',
    );
  });
});

describe('emailService.rescheduleMessage', function () {
  let axiosStub;

  afterEach(() => {
    axiosStub.restore();
  });

  it('patches /schedule/:sourceTrackingId with new time', async function () {
    let capturedConfig;
    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: {
          sourceTrackingId: 'tracking-id',
          scheduledAt: '2025-12-26T10:00:00Z',
          data: 'Rescheduled',
        },
      });
    });

    const service = emailService(testCredentials);
    const response = await service.rescheduleMessage('tracking-id', '2025-12-26T10:00:00Z');

    expect(capturedConfig.method).to.equal('PATCH');
    expect(capturedConfig.url).to.equal('/schedule/tracking-id');
    expect(capturedConfig.data.scheduled_at).to.equal('2025-12-26T10:00:00Z');
    expect(response.data).to.equal('Rescheduled');
  });

  it('throws if sourceTrackingId is missing', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function () {
      return Promise.resolve({ data: {} });
    });
    const service = emailService(testCredentials);
    await expect(service.rescheduleMessage(null, '2025-12-26T10:00:00Z')).to.be.rejectedWith(
      'sourceTrackingId is required',
    );
  });
});

describe('emailService.cancelScheduledMessage', function () {
  let axiosStub;

  afterEach(() => {
    axiosStub.restore();
  });

  it('posts to /schedule/:sourceTrackingId/cancel', async function () {
    let capturedConfig;
    axiosStub = sinon.stub(axios, 'create').returns(function (config) {
      capturedConfig = config;
      return Promise.resolve({
        data: {
          sourceTrackingId: 'tracking-id',
          state: 'cancelled',
          data: 'Cancelled',
        },
      });
    });

    const service = emailService(testCredentials);
    const response = await service.cancelScheduledMessage('tracking-id');

    expect(capturedConfig.method).to.equal('POST');
    expect(capturedConfig.url).to.equal('/schedule/tracking-id/cancel');
    expect(response.state).to.equal('cancelled');
  });

  it('throws if sourceTrackingId is missing', async function () {
    axiosStub = sinon.stub(axios, 'create').returns(function () {
      return Promise.resolve({ data: {} });
    });
    const service = emailService(testCredentials);
    await expect(service.cancelScheduledMessage(null)).to.be.rejectedWith(
      'sourceTrackingId is required',
    );
  });
});
