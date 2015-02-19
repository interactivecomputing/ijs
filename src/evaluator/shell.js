// shell.js
//

var npm = require('npm'),
    path = require('path'),
    vm = require('vm'),
    q = require('q');

var commands = require('./commands'),
    error = require('./error'),
    modules = require('./modules');

var _knownModules = {
  async: 'async',
  crypto: 'crypto',
  events: 'events',
  fs: 'fs',
  http: 'http',
  https: 'https',
  net: 'net',
  os: 'os',
  path: 'path',
  stream: 'stream',
  querystring: 'querystring',
  url: 'url',
  util: 'util',
  zlib: 'zlib'
};

function createGlobals(shell) {
  var globals = {
    Buffer: Buffer,
    console: console,
    require: function(name) {
      return shell._require(name);
    },
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
  this.requiredModules = {};
  this.installedModules = {};

  this._commands = {};

  this._state = createGlobals(this);
  this._context = vm.createContext(this._state);

  modules.initialize(this);
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

  return vm.runInContext(code, this._context, options);
}

Shell.prototype._evaluateCommand = function(text, evaluationId) {
  var commandInfo = commands.parse(text, this._commands);
  if (commandInfo) {
    return commandInfo.command(this, commandInfo.args, commandInfo.data, evaluationId);
  }

  return undefined;
}

Shell.prototype.registerCommand = function(name, command) {
  this._commands[name] = command;
}

Shell.prototype._require = function(name) {
  var module = this.requiredModules[name];
  if (module) {
    return module;
  }

  if (_knownModules[name]) {
    module = require(name);
  }
  else {
    var modulePath = path.join(this.config.modulesPath, 'node_modules', name);
    module = require(modulePath);
  }

  if (module) {
    this.requiredModules[name] = module;
  }

  return module;
};


function createShell(config, callback) {
  var npmOptions = {
    prefix: config.modulesPath,
    loglevel: 'silent',
    spin: false,
    color: false,
    unicode: false
  };
  npm.load(npmOptions, function() {
    callback(new Shell(config));
  });
}

module.exports = {
  create: createShell
};
