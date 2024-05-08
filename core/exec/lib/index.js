'use strict';

const Package = require('@hxl-cli/package');
const path = require('path');
const SETTINGS = {
  init: '@hxl-cli/init'
}
const CACHE_DIR = 'dependencies/';

function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  log.verbose('targetPath', targetPath);
  log.verbose('homePath', homePath);
  let storeDir = '';

  // 获取参数，因为不知道具体参数个数，所以使用 arguments
  const cmdObj = arguments[arguments.length - 1];
  // 获取传的参数名称
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = 'latest';
  if (!targetPath) {
    // 如果路径不存在，则设置缓存路径
    targetPath = path.resolve(homePath, CACHE_DIR);
    storeDir = path.resolve(targetPath, 'node_modules');
    log.verbose('targetPath', targetPath);
    log.verbose('storeDir', storeDir);
  }
  const pkg = new Package({
    targetPath,
    storeDir,
    packageName,
    packageVersion
  });
}
module.exports = exec;
