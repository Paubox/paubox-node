const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');
const fs = require('fs');

const emailService = require('../src/service/emailService.js');

chai.use(chaiAsPromised);

describe('emailService.getDynamicTemplate', function () {
  it('can get a dynamic template', async function () {
    this.skip();
  });
});
