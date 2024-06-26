'use strict';

const fs = require('fs');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const semver = require('semver');
const Command = require('@hxl-cli/command');
const Package = require('@hxl-cli/package');
const userHome = require('user-home');
const getProjectTemplate = require('./getProjectTemplate');
const { spinnerStart, sleep, execAsync } = require('@hxl-cli/utils');
const log = require('@hxl-cli/log');
const glob = require('glob');
const ejs = require('ejs');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';
const TEMPLATE_TYPE_NORMAL = 'normal';
const TEMPLATE_TYPE_CUSTOM = 'custom';
const WHITE_COMMAND = ['npm', 'cnpm'];

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
      await this.downloadTemplate();
      // 3. 安装模板
      await this.installTemplate();
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
  async downloadTemplate() {
    const { projectTemplate } = this.projectInfo;
    const templateInfo = this.template.find(item => item.npmName === projectTemplate);
    const targetPath = path.resolve(userHome, '.hxl-cli', 'template');
    const storeDir = path.resolve(userHome, '.hxl-cli', 'template', 'node_modules');
    const { npmName, version } = templateInfo;
    // 选择的模板改为全局变量
    this.templateInfo = templateInfo;
    const templateNpm = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version,
    });
    if (!await templateNpm.exists()) {
      // 在控制台添加loading效果动画
      const spinner = spinnerStart('正在下载模板...');
      await sleep();
      try {
        await templateNpm.install();
      } catch (e) {
        throw e;
      } finally {
        spinner.stop(true);
        // todo：应该等安装成功才赋值
        this.templateNpm = templateNpm;
        if (await templateNpm.exists()) {
          console.log('下载模板成功');
          this.templateNpm = templateNpm;
          log.success('下载模板成功');
        } else {
          console.log('下载模板失败');
          console.log(templateNpm);
        }
      }
    } else {
      const spinner = spinnerStart('正在更新模板...');
      await sleep();
      try {
        await templateNpm.update();
      } catch (e) {
        throw e;
      } finally {
        spinner.stop(true);
        if (await templateNpm.exists()) {
          this.templateNpm = templateNpm;
          log.success('更新模板成功');
        }
      }
    }
    // 1. 通过项目模板API获取项目模板信息
    // 1.1 通过egg.js搭建一套后端系统
    // 1.2 通过npm存储项目模板
    // 1.3 将项目模板信息存储到mongodb数据库中
    // 1.4 通过egg.js获取mongodb中的数据并且通过API返回
  }
  async installTemplate() {
    console.log(this.templateInfo);
    if (this.templateInfo) {
      if (!this.templateInfo.type) {
        this.templateInfo.type = TEMPLATE_TYPE_NORMAL;
      }
      if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
        // 标准安装
        await this.installNormalTemplate();
      } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
        // 自定义安装
        await this.installCustomTemplate();
      } else {
        throw new Error('无法识别项目模板类型！');
      }
    } else {
      throw new Error('项目模板信息不存在！');
    }
  }
  checkCommand(cmd) {
    if (WHITE_COMMAND.includes(cmd)) {
      return cmd;
    }
    return null;
  }
  async execCommand(command, errMsg) {
    let ret;
    if (command) {
      const cmdArray = command.split(' ');
      const cmd = this.checkCommand(cmdArray[0]);
      const args = cmdArray.slice(1);
      if (!cmd) {
        throw new Error('命令不存在!命令：' + command);
      }
      await execAsync(cmd, args, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    }
    if (ret !== 0) {
      throw new Error(errMsg);
    }
    return ret;
  }
  async ejsRender(options) {
    const dir = process.cwd();
    const projectInfo = this.projectInfo;
    return new Promise((resolve, reject) => {
      glob('**', {
        cwd: dir,
        ignore: options.ignore || '',
        nodir: true,
      }, function(err, files) {
        if (err) {
          reject(err);
        }
        Promise.all(files.map(file => {
          const filePath = path.join(dir, file);
          return new Promise((resolve1, reject1) => {
            ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
              if (err) {
                reject1(err);
              } else {
                fse.writeFileSync(filePath, result);
                resolve1(result);
              }
            });
          });
        })).then(() => {
          resolve();
        }).catch(err => {
          reject(err);
        });
      });
    });
  }
  async installNormalTemplate() {
    console.log('安装普通模板');
    console.log(this.templateNpm.cacheFilePath);
    console.log(this.templateNpm);
    // 拷贝模板代码至当前目录
    let spinner = spinnerStart('正在安装模板...');
    try {
      const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template');
      const targetPath = process.cwd();
      fse.ensureDirSync(templatePath);
      fse.ensureDirSync(targetPath);
      fse.copySync(templatePath, targetPath)
    } catch (e) {
      throw e;
    } finally {
      spinner.stop(true);
      log.success('安装模板成功');
    }
    const templateIgnore = this.templateInfo.ignore || [];
    const ignore = ['**/node_modules/**', ...templateIgnore];
    await this.ejsRender({ignore});
    // 依赖安装
    const {installCommand, startCommand } = this.templateInfo;
    await this.execCommand(installCommand, '依赖安装失败');
    // 启动命令执行
    await this.execCommand(startCommand, '启动命令执行失败');
  }
  async installCustomTemplate() {
      console.log('安装自定义模板');
      // 查询自定义模板的入口文件
      if (await this.templateNpm.exists()) {
        const rootFile = this.templateNpm.getRootFilePath();
        if (fs.existsSync(rootFile)) {
          console.log('开始执行自定义模板');
          const options = {
            ...this.templateInfo,
            cwd: process.cwd()
          };
          const code = `require('${rootFile}')(${JSON.stringify(options)})`;
          await execAsync('node', ['-e', code], {stdio: 'inherit', cwd: process.cwd()});
          console.log('自定义模板安装成功');

        } else {
          throw new Error('自定义模板入口文件不存在');
        }
      } else {
        console.log('templateNpm不存在', this.templateNpm);
      }
  }
  async getProjectInfo() {
    function isValidName(v) {
      return /^(@[a-zA-Z0-9-_]+\/)?[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v);
    }
    let projectInfo = {};
    let isProjectNameValid = false;
    if (isValidName(this.projectName)) {
      isProjectNameValid = true;
      projectInfo.projectName = this.projectName;
    }
    // 1. 选择创建项目或组件
    const { type } = await inquirer.prompt({
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
      }],
    });
    // 筛选出项目或组件模板
    this.template = this.template.filter(template => template.tag.includes(type));
    const title = type === TYPE_PROJECT ? '项目' : '组件';
    const projectNamePrompt = {
      type: 'input',
      name: 'projectName',
      message: `请输入${title}名称`,
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
    }
    const projectPrompt = [];
    if (!isProjectNameValid) {
      projectPrompt.push(projectNamePrompt);
    }
    projectPrompt.push({
      type: 'input',
      name: 'projectVersion',
      message: `请输入${title}版本`,
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
    }, {
      type: 'list',
      name: 'projectTemplate',
      message: `请选择${title}模板`,
      choices: this.createTemplateChoice()
    });
    // 3. 选择创建项目或组件
    if (type === TYPE_PROJECT) {
      // 2. 获取项目基本信息
      const project = await inquirer.prompt(projectPrompt);
      projectInfo = {
        ...projectInfo,
        type,
        ...project
      };
    } else if (type === TYPE_COMPONENT) {
      const descriptionPrompt = {
        type: 'input',
        name: 'componentDescription',
        message: '请输入组件描述信息',
        default: '',
        validate: function(v) {
          const done = this.async();
          setTimeout(function() {
            if (!v) {
              done('请输入组件描述信息');
              return;
            }
            done(null, true);
          }, 0);
        },
      };
      projectPrompt.push(descriptionPrompt);
      // 2. 获取组件的基本信息
      const component = await inquirer.prompt(projectPrompt);
      projectInfo = {
        ...projectInfo,
        type,
        ...component,
      };
    }
    // 生成classname（将驼峰转为-连接）
    if (projectInfo.projectName) {
      projectInfo.className = require('kebab-case')(projectInfo.projectName).replace(/^-/, '');
    }
    if (projectInfo.projectVersion) {
      projectInfo.version = projectInfo.projectVersion;
    }
    if (projectInfo.componentDescription) {
      projectInfo.description = projectInfo.componentDescription;
    }
    // 4. 获取项目的基本信息
    return projectInfo;
  }
  createTemplateChoice() {
    return this.template.map(item => ({
      value: item.npmName,
      name: item.name
    }));
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