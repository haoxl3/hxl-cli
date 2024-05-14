const request = require('@hxl-cli/request');

module.exports = function() {
    return request({
        url: '/project/template',
    });
}