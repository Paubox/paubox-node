const chai = require('chai');
const { expect } = chai;

const emailService = require('../src/service/emailService.js');

describe('emailService constructor', function () {
  it('constructs with only an apiKey and uses the versioned base URL', function () {
    const service = emailService({ apiKey: 'api-key-12345' });
    expect(service.baseURL).to.equal('https://api.paubox.com/v1/');
  });

  it('ignores a legacy apiUsername without throwing', function () {
    const service = emailService({
      apiUsername: 'authorized_domain',
      apiKey: 'api-key-12345',
    });
    expect(service.baseURL).to.equal('https://api.paubox.com/v1/');
    expect(service.apiUser).to.equal(undefined);
  });

  it('falls back to the API_KEY environment variable', function () {
    const saved = process.env.API_KEY;
    process.env.API_KEY = 'env-api-key';
    try {
      const service = emailService();
      expect(service.baseURL).to.equal('https://api.paubox.com/v1/');
    } finally {
      if (saved === undefined) {
        delete process.env.API_KEY;
      } else {
        process.env.API_KEY = saved;
      }
    }
  });

  it('throws when no apiKey is configured', function () {
    const saved = process.env.API_KEY;
    delete process.env.API_KEY;
    try {
      expect(() => emailService()).to.throw('apiKey is missing.');
    } finally {
      if (saved !== undefined) {
        process.env.API_KEY = saved;
      }
    }
  });
});
