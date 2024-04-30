'use strict';

module.exports = core;

const pkg = require('../package.json');
const log = require('@hxl-cli/log');

function core() {
  console.log('I am core');
  checkPkgVersion();
}

function checkPkgVersion() {
  console.log(pkg.version);
  log.info('cli', pkg.version);
}