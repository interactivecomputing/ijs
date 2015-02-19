// shell.js
//

var vm = require('vm'),
    q = require('q');

var commands = require('./commands'),
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
  var commandInfo = commands.parse(text, this.commands);
  if (commandInfo) {
    return commandInfo.command(this, commandInfo.args, commandInfo.data, evaluationId);
  }

  return undefined;
}

Shell.prototype.registerCommand = function(name, command) {
  this.commands[name] = command;
}


function createShell(config, callback) {
  var shell = new Shell(config);

  modules.initialize(shell, function() {
    var state = createGlobals(shell);
    shell.context = vm.createContext(state);

    callback(shell);
  });
}

module.exports = {
  create: createShell
};
