// Copyright 2015 Interactive Computing project (https://github.com/interactivecomputing).
// All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
// except in compliance with the License. You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software distributed under the
// License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
// either express or implied. See the License for the specific language governing permissions
// and limitations under the License.
//
// shell.js
// Implements the shell functionality used by the kernel. This manages evaluation state, and
// executes code against that state.
//

var nomnom = require('nomnom'),
    q = require('q'),
    vm = require('vm');

var commands = require('./commands'),
    error = require('./error'),
    modules = require('./modules');


// Creates the global objects variables that serves as the initial state managed by the shell.
function createGlobals(shell) {
  var globals = {
    Buffer: Buffer,
    console: console,
    runAsync: function(fn) {
      var deferred = q.defer();
      fn(deferred);

      return deferred.promise;
    }
  };

  globals.global = globals;

  return globals;
}


// The Shell object to manage configuration, shell functionality and session state.
function Shell(config) {
  this.config = config;
  this.commands = {};
  this.state = vm.createContext(createGlobals(this));
}

// Creates traces for errors raised within the shell. It removes the Shell and underlying
// kernel-specific stack frames to provide a user code-only trace.
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

// Evalutes the user's input in context of the shell's state to produce an evaluation result.
Shell.prototype.evaluate = function(text, evaluationId) {
  if (text.charAt(0) === '%') {
    return this._evaluateCommand(text, evaluationId);
  }
  else {
    return this._evaluateCode(text, evaluationId);
  }
}

// Evaluates code within the shell. The code executes in context of the shell's state, and
// any side-effects to that state are preserved. The value resulting from the final expression
// within the code is used as the result of the evaluation.
Shell.prototype._evaluateCode = function(code, evaluationId) {
  // Use the evaluation id to identify this code when it shows up in stack traces.
  // Turn off automatic display of errors for things like syntax errors.

  var options = { filename: 'code', displayErrors: false };
  options.toString = function() {
    return 'code[' + evaluationId + ']';
  };

  return vm.runInContext(code, this.state, options);
}

// Evaluates as % or %% command (aka line or cell magic).
Shell.prototype._evaluateCommand = function(text, evaluationId) {
  var commandInfo = this._parseCommand(text);
  if (!commandInfo) {
    return undefined;
  }

  return commandInfo.command(this, commandInfo.args, commandInfo.data, evaluationId);
}

// Attempts to parse a % or %% command into a command function along with associated arguments
// and data.
Shell.prototype._parseCommand = function(text) {
  // Treat everything after the first line as data.
  // TODO: Support for multi-line command lines when the line ends with a '\' terminator.
  var data = '';
  var newLine = text.indexOf('\n');
  if (newLine > 0) {
    data = text.substr(newLine + 1);
    text = text.substr(0, newLine);
  }

  // Either %name or %%name followed by a command line (that will be parsed as arguments).
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

  var argsParser =
    nomnom().script(name).nocolors().printer(function(s, code) {
      if (code) {
        throw error.create(s);
      }

      console.log(s);
    });
  var args = match[3] || '';
  args = args.trim();
  args = args.length ? args.split(' ') : [];
  args = command.options(argsParser).parse(args);

  if (args) {
    return {
      command: command,
      args: args,
      data: data
    };
  }

  // There was an problem parsing arguments (the error itself already printed out by the argparser)
  return null;
}

// Registers a command for use in the shell via a cell magic syntax, i.e. %name or %%name.
Shell.prototype.registerCommand = function(name, command) {
  this.commands[name] = command;
}


// Creates and initializes a Shell object.
function createShell(config, callback) {
  var shell = new Shell(config);

  modules.initialize(shell, function() {
    commands.initialize(shell);
    callback(shell);
  });
}


module.exports = {
  create: createShell
};
