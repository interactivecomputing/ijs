// commands.js
//

var nomnom = require('nomnom');
var error = require('./error');

var _commandPattern = /^%%?([a-zA-Z0-9\\._]+)(\s+)?([^\n]*)?(\n)?(.*)?$/;

function parseCommand(text, commands) {
  var match = _commandPattern.exec(text);
  if (!match) {
    throw error.create('Invalid command syntax.');
  }

  var name = match[1];
  var command = commands[name];
  if (!command) {
    throw error.create('Unknown command named "%s".', name);
  }

  var args = match[3] || '';
  args = args.trim();
  if (args.length) {
    args = args.split(' ');
  }
  else {
    args = [];
  }

  var parser =
    nomnom().script(name).nocolors().printer(function(s, code) {
      if (code) {
        throw error.create(s);
      }

      console.log(s);
    });
  args = command.options(parser).parse(args);

  if (args) {
    return {
      command: command,
      args: args,
      data: match[5] || ''
    };
  }

  return null;
}

module.exports = {
  parse: parseCommand
};
