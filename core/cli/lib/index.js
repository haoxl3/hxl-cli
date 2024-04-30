'use strict';

module.exports = core;

const pkg = require('../package.json');
const log = require('@hxl-cli/log');
// const colors = require('colors');
const userHome = require('user-home'); // 检查是否在主目录
const pathExists = require('path-exists').sync; // 检查文件是否存在

function core() {
  console.log('I am core');
  try {
    checkPkgVersion();
    checkRoot();
    checkUserHome();
  } catch (e) {
    log.error(e.message);
  }
}

function checkPkgVersion() {
  console.log(pkg.version);
  log.info('cli', pkg.version);
}

function checkNodeVersion() {
  // const currentVersion = process.version;
  // const lowestVersion = constant.LOWEST_NODE_VERSION;
  // if (!semver.gte(currentVersion, lowestVersion)) {
  //   throw new Error(colors.red(`hxl-cli 需要安装v${lowestVersion}以上的node版本，请升级node版本`));
  // } else {
  //   log.info('node', currentVersion);
  // }
}

function checkRoot() {
  const rootCheck = require('root-check');
  rootCheck();
  // 当输出0代表是root用户，否则不是
  console.log(process.geteuid());
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error('当前用户没有主目录，请检查');
  } else {
    log.info('userHome', userHome);
  }
}