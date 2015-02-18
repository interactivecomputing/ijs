// commands.js
//

var _commandPattern = /^%%?([a-zA-Z0-9\\._]+)(\s+)?([^\n]*)?(\n)?(.*)?$/;

function parseCommand(text) {
  var match = _commandPattern.exec(text);
  if (!match) {
    return null;
  }

  var command = {
    name: match[1],
    args: match[3] || '',
    data: match[5] || ''
  };

  command.args = command.args.trim();
  if (command.args.length) {
    command.args = command.args.split(' ');
  }
  else {
    command.args = [];
  }

  return command;
}

module.exports = {
  parse: parseCommand
};
