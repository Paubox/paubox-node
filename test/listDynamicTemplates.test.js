const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');
const fs = require('fs');

const emailService = require('../src/service/emailService.js');

chai.use(chaiAsPromised);

describe('emailService.listDynamicTemplates', function () {
  it('can list dynamic templates', async function () {
    this.skip();
  });
});
