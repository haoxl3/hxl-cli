'use strict';
const axios = require('axios');
// hxl-cli-server服务启动地址
const BASE_URL = process.env.HXL_CLI_BASE_URL ? process.env.HXL_CLI_BASE_URL : 'http://127.0.0.1:7001';

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 5000
});
request.interceptors.response.use(response => {
  return response.data;
}, error => {
  return Promise.reject(error);
});
module.exports = request;
