'use strict';

module.exports = core;

const pkg = require('../package.json');
function core() {
  console.log('I am core');
  checkPkgVersion();
}

function checkPkgVersion() {
  console.log(pkg.version);
}