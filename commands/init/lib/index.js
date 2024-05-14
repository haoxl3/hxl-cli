'use strict';

const fs = require('fs');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const semver = require('semver');
const Command = require('@hxl-cli/command');
const getProjectTemplate = require('./getProjectTemplate');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.force;
  }
  async exec() {
    // 1. 准备
    const projectInfo = await this.prepare();
    if (projectInfo) {
      // 2. 下载模板
      this.projectInfo = projectInfo;
      this.downloadTemplate();
      // 3. 安装模板
    }
    
  }
  async prepare() {
    // 0. 判断项目模板是否存在
    const template = await getProjectTemplate();
    if (!template || template.length === 0) {
      throw new Error('没有找到项目模板');
    }
    this.template = template;
    const localPath = process.cwd();
    // 1. 判断当前目录是否为空
    if (!this.isDirEmpty(localPath)) {
      let ifContinue = false;
      // 询问是否继续创建项目
      if (!this.force) {
        ifContinue = (await inquirer.prompt([{
          type: 'confirm',
          name: 'ifContinue',
          default: false,
          message: `当前目录不为空，是否继续创建项目？`,
        }])).ifContinue;
        console.log(ifContinue);
        if (!ifContinue) {
          return;
        }
      }
      // 2. 是否启动强制更新
      if (ifContinue || this.force) {
        // 给用户做二次确认
        const { confirmDelete } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirmDelete',
          default: false,
          message: `是否确认清空当前目录下的文件？`,
        }]);
        if (confirmDelete) {
          // 清空当前目录
          fse.emptyDirSync(localPath);
        }
      }
    }
    return this.getProjectInfo();
    
  }
  downloadTemplate() {
    console.log(this.projectInfo);
    console.log(this.template);
    // 1. 通过项目模板API获取项目模板信息
    // 1.1 通过egg.js搭建一套后端系统
    // 1.2 通过npm存储项目模板
    // 1.3 将项目模板信息存储到mongodb数据库中
    // 1.4 通过egg.js获取mongodb中的数据并且通过API返回
  }
  async getProjectInfo() {
    function isValidName(v) {
      return /^(@[a-zA-Z0-9-_]+\/)?[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v);
    }
    const projectInfo = {};
    // 3. 选择创建项目或组件
    const {type} = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: TYPE_PROJECT,
      choices: [{
        name: '项目',
        value: TYPE_PROJECT,
      }, {
        name: '组件',
        value: TYPE_COMPONENT,
      }]
    });
    if (type === TYPE_PROJECT) {
      const o = await inquirer.prompt([{
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称',
        default: '',
        validate: function(v) {
          const done = this.async();
          setTimeout(function() {
            // 1.首字符必须为英文字符
            // 2.尾字符必须为英文或数字，不能为字符
            // 3.字符仅允许"-_"
            if (!isValidName(v)) {
              done(`请输入合法的名称`);
              return;
            }
            done(null, true);
          }, 0);
        },
        filter: (v) => {
          return v;
        }
      }, {
        type: 'input',
        name: 'projectVersion',
        message: '请输入项目版本',
        default: '',
        validate: function(v) {
          const done = this.async();
          setTimeout(function() {
            if (!(!!semver.valid(v))) {
              done('请输入合法的版本号');
              return;
            }
            done(null, true);
          }, 0);
        },
        filter: (v) => {
          return v;
        }
      }]);
    } else if (type === TYPE_COMPONENT) {
    }
    // 4. 获取项目的基本信息
    return projectInfo;
  }
  isDirEmpty(localPath) {
    // 获取当前目录下的文件列表
    let fileList = fs.readdirSync(localPath);
    fileList = fileList.filter(file => !file.startsWith('.') && ['node_modules', 'dist'].indexOf(file) < 0);
    return !fileList || fileList.length <= 0;
  }
}
function init(argv) {
  // console.log('***init***', argv);
  return new InitCommand(argv);
}
module.exports.InitCommand = InitCommand;
module.exports = init;