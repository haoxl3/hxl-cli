'use strict';

const { isObject } = require('@hxl-cli/utils');
const pkgDir = require('pkg-dir').sync;
const path = require('path');
const formatPath = require('@hxl-cli/format-path');
const npminstall = require('npminstall');
const { getDefaultRegistry, getNpmLatestVersion } = require('@hxl-cli/get-npm-info');
const pathExists = require('path-exists').sync;

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
    // package的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
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
  get cacheFilePath() {
    // 缓存目录下的包名为_@hxl-cli_init@1.0.0@@hxl-cli/
    // 实际获取包名为@hxl-cli/init ，版本1.0.0
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
  }
  async prepare() {
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
  }
  // 判断当前package是否存在
  async exists() {
    if (this.storeDir) {
      await this.prepare();
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }
  // 更新package
 update() {

  }
  // 安装package
  async install() {
    await this.prepare();
    return npminstall({
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
