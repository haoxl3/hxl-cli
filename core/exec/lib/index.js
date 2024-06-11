'use strict';

const Package = require('@hxl-cli/package');
const log = require('@hxl-cli/log');
const path = require('path');
const cp = require('child_process');
const { exec: spawn } = require('@hxl-cli/utils');

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
    try {
      // apply使用将参数arguments由数组转为init命令需要的参数形式
      // require(rootFile).apply(null, arguments);
      // require(rootFile).call(null, Array.from(arguments));
      // 将上面的代码换成node多进程方式,rootFile将调用commands/init/lib/index.js
      // const code = 'console.log(1)';
      const args = Array.from(arguments);
      const cmd = args[args.length - 1];
      const o = Object.create(null);
      // 将参数瘦身，去掉_和parent、对象自己的属性
      Object.keys(cmd).forEach(key => {
        if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
          o[key] = cmd[key];
        }
      });
      args[args.length - 1] = o;
      const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
      const child = spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      child.on('error', e => {
        console.log('*****error*****', e);
      });
      child.on('exit', e => {
        console.log('******exit 命令执行成功*****');
        process.exit(e);
      });
    } catch (e) {
      console.log(e.message);
    }
  }
}
module.exports = exec;
