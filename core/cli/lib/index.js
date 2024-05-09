'use strict';

module.exports = core;

const path = require('path');
const pkg = require('../package.json');
const log = require('@hxl-cli/log');
// const colors = require('colors');
const userHome = require('user-home'); // 检查是否在主目录
const pathExists = require('path-exists').sync; // 检查文件是否存在
const constant = require('./const');
const semver = require('semver');
const commander = require('commander');
const init = require('@hxl-cli/init');
const exec = require('@hxl-cli/exec');

const program = new commander.Command();

async function core() {
  console.log('I am core');
  try {
    await prepare();
    registerCommand();
  } catch (e) {
    log.error(e.message);
  }
}
async function prepare() {
  checkPkgVersion();
  checkRoot();
  checkUserHome();
  // checkInputArgs();
  // logo默认是info2000，需要修改LOG_LEVEL才可打印出debug
  // log.verbose('debug', 'test debug log');
  checkEnv();
  await checkGlobalUpdate();
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
  console.log('rootCheck', process.geteuid());
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error('当前用户没有主目录，请检查');
  } else {
    log.info('userHome', userHome);
  }
}

function checkInputArgs() {
  const minimist = require('minimist');
  const args = minimist(process.argv.slice(2));
  // 如果控制台输入了debug参数，修改logo的级别为verbose
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose';
  } else {
    process.env.LOG_LEVEL = 'info';
  }
  log.level = process.env.LOG_LEVEL;
}

function checkEnv() {
  const dotenv = require('dotenv');
  const dotenvPath = path.resolve(userHome, '.env');
  // 如果存在.env文件则打印，否则创建一个.env文件
  console.log('*********checkEnv*********', pathExists(dotenvPath))
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath
    });
  } else {
    const cliConfig = {
      home: userHome
    };
    if (process.env.CLI_HOME) {
      cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
    } else {
      cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME);
    }
    process.env.CLI_HOME_PATH = cliConfig['cliHome'];
  }
  console.log('**CLI_HOME_PATH****', process.env.CLI_HOME_PATH);
}

async function checkGlobalUpdate() {
  // 1.获取当前版本号和模块名
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  // 2. 调用npm API获取所有版本号
  const { getNpmSemverVersion } = require('@hxl-cli/get-npm-info');
  // 3. 提取所有版本号，比对哪些版本号是大于当前版本号
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName);
  // 4. 获取最新的版本号，提示用户更新到该版本
  console.log('***checkGlobalUpdate***', lastVersion && semver.gt(lastVersion, currentVersion));
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(colors.yellow(`请手动更新${npmName},当前版本为${currentVersion},最新版本为${lastVersion}`))
  }
}

function registerCommand() {
  console.log('*******registerCommand******');
  // 注册命令
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '');
  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制初始化项目')
    .action(exec);
  // 开启debug模式
  program.on('option:debug', function() {
    if (program.debug) {
      process.env.LOG_LEVEL = 'verbose';
    } else {
      process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
  });
  // 监听全局变量targetPath
  program.on('option:targetPath', function() {
    // 传给环境变量
    program.env.CLI_TARGET_PATH = program.targetPath;
  });
  // 监听未知命令
  program.on('command:*', function(obj) {
    const availableCommands = program.commands.map(cmd => cmd.name());
    console.log(colors.red('未知的命令：' + obj[0]));
    if (availableCommands.length) {
      console.log(colors.red('可用命令：' + availableCommands.join(', ')));
    }
  });
  // console.log('program', program);
  program.parse(process.argv);
  // 未输入命令时打印出帮忙文档
  if (program.args && program.args.length < 1) {
    program.outputHelp();
  }
}