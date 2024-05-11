'use strict';
const semver = require('semver');
// const log = require('@hxl-cli/log');
const colors = require('colors');
const LOWEST_NODE_VERSION = '12.0.0';


class Command {
  constructor(argv) {
    console.log('command', argv);
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion());
    })
  }
  init() {}
  exec() {}
  checkNodeVersion() {
    const currentVersion = process.version;
    const lowestVersion = LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(colors.red(`hxl-cli 需要安装v${lowestVersion}以上的node版本，请升级node版本`));
    } else {
      // log.info('node', currentVersion);
      console.log('node=', currentVersion);
    }
  }
}
module.exports = Command;
