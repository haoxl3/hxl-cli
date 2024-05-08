'use strict';

const { isObject } = require('@hxl-cli/utils');
const pkgDir = require('pkg-dir').sync;
const path = require('path');
const formatPath = require('@hxl-cli/format-path');
const npminstall = require('npminstall');
const { getDefaultRegistry } = require('@hxl-cli/get-npm-info');

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('options is required');
    }
    if (!isObject(options)) {
      throw new Error('options must be an object');
    }
    // package的路径
    this.targetPath = options.targetPath;
    // 缓存package的路径
    this.storeDir = options.storeDir;
    // package的名称
    this.packageName = options.packageName;
    // package的版本
    this.packageVersion = options.packageVersion;
  }
  // 获取入口文件的路径
  getRootFilePath() {
    // 1. 获取package.json所在目录
    const dir = pkgDir(this.targetPath);
    if (dir) {
      // 2. 读取package.json
      const pkgFile = require(path.resolve(dir, 'package.json'));
      // 3. 寻找main/lib获取入口文件路径
      if (pkgFile && pkgFile.main) {
        // 4. 路径的兼容(macOS/windows)
        return formatPath(path.resolve(dir, pkgFile.main));
      }
    }
    return null;
  }
  // 安装package
  install() {
    npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [
        {name: this.packageName, version: this.packageVersion}
      ]
    })
  }
}

module.exports = Package;
