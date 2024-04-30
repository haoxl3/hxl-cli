'use strict';

const log = require('npmlog');

// 定义logo级别，默认级别为info，info级别值为2000，大于2000才会在控制台输出log内容
log.level = process.env.LOG_LEVEL || 'info';
// 添加自定义命令
log.addLevel('success', 2000, {fg: 'green', bold: true});

module.exports = log;

