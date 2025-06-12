const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised').default;

const sinon = require('sinon');
const axios = require('axios');
const fs = require('fs');

const emailService = require('./emailService.js');

chai.use(chaiAsPromised);

describe('emailService.updateDynamicTemplate', function () {
  it('can update a dynamic template', async function () {
    this.skip();
  });
});
