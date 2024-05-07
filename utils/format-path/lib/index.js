'use strict';

const path = require('path');

function formatPath(p) {
  if (p && typeof p === 'string') {
    const sep = path.sep;
    if (sep === '/') {
      return p;
    } else {
      // 将windows路径反斜杠转换为正斜杠
      return p.replace(/\\/g, '/');
    }
  }
  return p;
}
module.exports = formatPath;
