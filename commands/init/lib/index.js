'use strict';

const Command = require('@hxl-cli/command');

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.force;
  }
}
function init(argv) {
  // console.log('***init***', argv);
  return new InitCommand(argv);
}
module.exports.InitCommand = InitCommand;
module.exports = init;