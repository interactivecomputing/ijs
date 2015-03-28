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
    tern = require('tern'),
    vm = require('vm');

var ijsrt = require('ijs.runtime');

var commands = require('./commands'),
    error = require('./error'),
    extensions = require('./extensions'),
    modules = require('./modules');


// Creates the global objects variables that serves as the initial state managed by the shell.
function createGlobals(shell) {
  var globals = {
    Buffer: Buffer,
    console: console,
    _: ijsrt
  };

  globals.global = globals;

  return globals;
}

// Converts a result/error tuple into a promise, if the result is not already a promise.
function createPromise(result, error) {
  // Create a pre-rejected promise for errors.
  if (error) {
    var deferred = q.defer();
    deferred.reject(error);

    return deferred.promise;
  }

  // Create a pre-resolved promise with the result when the result is not a promise.
  if ((result === null) || (result === undefined) ||
      (typeof result != 'object') ||
      (typeof result.then != 'function')) {
    var deferred = q.defer();
    deferred.resolve(result);

    return deferred.promise;
  }

  return result;
}


// The Shell object to manage configuration, shell functionality and session state.
function Shell(config) {
  this.config = config;
  this.commands = {};
  this.state = vm.createContext(createGlobals(this));
  this.code = '';

  require('../../node_modules/tern/plugin/node.js');
  var ternOptions = {
    defs: [require('../../node_modules/tern/defs/ecma5.json')],
    plugins: { node: {} }
  };
  this.ternServer = new tern.Server(ternOptions);
}

// Appends code to the shell's code buffer
Shell.prototype.appendCode = function(code) {
  // Append the new code to the code buffer if it didn't look like a re-execution of
  // previously executed code.
  if (this.code.indexOf(code) < 0) {
    this.code += '\n' + code;
  }
}

// Creates errors for the purposes of displaying just an error message, without any stack trace.
Shell.prototype.createError = function() {
  return error.create.apply(null, arguments);
}

// Creates traces for errors raised within the shell. It removes the Shell and underlying
// kernel-specific stack frames to provide a user code-only trace.
Shell.prototype.createTrace = function(error) {
  if (error.constructor != Error) {
    return [ error.toString() ];
  }

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

// Attempts to find a list of matches at the specified position in the specified text block.
// Returns a set of completions and the text being completed.
Shell.prototype.complete = function(text, position) {
  var codeBuffer = this.code + '\n' + text;
  position += this.code.length + 1;

  var query = { type: 'completions', file: 'code', end: position };
  var file = { type: 'full', name: 'code', text: codeBuffer };

  var deferred = q.defer();
  this.ternServer.request({ query: query, files: [file] }, function(error, response) {
    if (!error) {
      var result = {
        completions: response.completions,
        prefix: codeBuffer.substr(response.start, response.end)
      };

      deferred.resolve(result);
    }
  });

  return deferred.promise;
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
  var shell = this;

  var result = undefined;
  var error = null;
  try {
    // Use the evaluation id to identify this code when it shows up in stack traces.
    // Turn off automatic display of errors for things like syntax errors.

    var options = { filename: 'code', displayErrors: false };
    options.toString = function() {
      return 'code[' + evaluationId + ']';
    };

    result = vm.runInContext(code, this.state, options);
  }
  catch(e) {
    error = e;
  }

  // Convert the result into a promise (if it isn't already one). Both sync and async results
  // are handled in the same way.
  var promise = createPromise(result, error);
  return promise.then(function(result) {
    // Append the code, since it successfully completed execution.
    shell.appendCode(code);
    return result;
  });
}

// Evaluates as % or %% command (aka line or cell magic).
Shell.prototype._evaluateCommand = function(text, evaluationId) {
  var result = undefined;
  var error = null;

  var commandInfo = this._parseCommand(text);
  if (commandInfo) {
    try {
      result = commandInfo.command(this, commandInfo.args, commandInfo.data, evaluationId);
    }
    catch(e) {
      error = e;
    }
  }

  return createPromise(result, error);
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

  modules.initialize(shell);
  extensions.initialize(shell);
  commands.initialize(shell);

  process.nextTick(function() {
    callback(shell);
  });
}


module.exports = {
  create: createShell
};
