'use strict';

const Package = require('@hxl-cli/package');
const log = require('@hxl-cli/log');
const path = require('path');
const SETTINGS = {
  init: '@hxl-cli/init'
}
const CACHE_DIR = 'dependencies/';

async function exec() {
  console.log('******exec*****')
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  log.verbose('targetPath', targetPath);
  log.verbose('homePath', homePath);
  let storeDir = '';
  // console.log('****process****', process.env);
  console.log('*****19 targetPath=', targetPath);
  // 获取参数，因为不知道具体参数个数，所以使用 arguments
  const cmdObj = arguments[arguments.length - 1];
  // 获取传的参数名称
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = 'latest';
  let pkg;
  if (!targetPath) {
    // 如果路径不存在，则设置缓存路径
    targetPath = path.resolve(homePath, CACHE_DIR);
    storeDir = path.resolve(targetPath, 'node_modules');
    log.verbose('targetPath', targetPath);
    log.verbose('storeDir', storeDir);
    console.log('targetPath=', targetPath);
    console.log('storeDir=', storeDir);
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion
    });
    if (await pkg.exists()) {
      // 更新package
      await pkg.update();
    } else {
      // 安装package
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion
    });
  }
  const rootFile = pkg.getRootFilePath();
  // 获取入口文件并调用
  console.log('****rootFile******', rootFile);
  if (rootFile) {
    // apply使用将参数arguments由数组转为init命令需要的参数形式
    // require(rootFile).apply(null, arguments);
    require(rootFile).call(null, Array.from(arguments));
  }
  
}
module.exports = exec;
