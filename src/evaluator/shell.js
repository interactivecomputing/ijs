// shell.js
//

var nomnom = require('nomnom'),
    q = require('q'),
    vm = require('vm');

var commands = require('./commands'),
    error = require('./error'),
    modules = require('./modules');

function createGlobals(shell) {
  var globals = {
    Buffer: Buffer,
    console: console,
    require: shell.require,
    runAsync: function(fn) {
      var deferred = q.defer();
      fn(deferred);

      return deferred.promise;
    }
  };

  globals.global = globals;

  return globals;
}

function Shell(config) {
  this.config = config;
  this.commands = {};
}

Shell.prototype.createTrace = function(error) {
  var lines = (error.stack || '').split('\n');

  var trace = [];
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('Shell.') > 0) {
      break;
    }
    trace.push(lines[i]);
  }

  return trace;
}

Shell.prototype.evaluate = function(text, evaluationId) {
  if (text.charAt(0) === '%') {
    return this._evaluateCommand(text, evaluationId);
  }
  else {
    return this._evaluateCode(text, evaluationId);
  }
}

Shell.prototype._evaluateCode = function(code, evaluationId) {
  var options = { filename: 'code', displayErrors: false };
  options.toString = function() {
    return 'code[' + evaluationId + ']';
  };

  return vm.runInContext(code, this.context, options);
}

Shell.prototype._evaluateCommand = function(text, evaluationId) {
  var commandInfo = this._parseCommand(text);
  if (!commandInfo) {
    return undefined;
  }

  return commandInfo.command(this, commandInfo.args, commandInfo.data, evaluationId);
}

Shell.prototype._parseCommand = function(text) {
  var data = '';
  var newLine = text.indexOf('\n');
  if (newLine > 0) {
    data = text.substr(newLine + 1);
    text = text.substr(0, newLine);
  }

  var commandPattern = /^%%?([a-zA-Z0-9\\._]+)(\s+)?(.*)?$/;
  var match = commandPattern.exec(text);
  if (!match) {
    throw error.create('Invalid command syntax.');
  }

  var name = match[1];
  var command = this.commands[name];
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
      data: data
    };
  }

  return null;
}

Shell.prototype.registerCommand = function(name, command) {
  this.commands[name] = command;
}


function createShell(config, callback) {
  var shell = new Shell(config);

  modules.initialize(shell, function() {
    commands.initialize(shell);

    var state = createGlobals(shell);
    shell.context = vm.createContext(state);

    callback(shell);
  });
}

module.exports = {
  create: createShell
};
