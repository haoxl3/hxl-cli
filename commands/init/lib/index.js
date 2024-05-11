'use strict';

const Command = require('@hxl-cli/command');

class InitCommand extends Command {

}
function init() {
  return new InitCommand();
}
module.exports.InitCommand = InitCommand;
module.exports = init;