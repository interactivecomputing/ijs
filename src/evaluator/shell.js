// shell.js
//

var npm = require('npm'),
    path = require('path'),
    vm = require('vm');

var _knownModules = {
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

var _commandPattern = /^%%?([a-zA-Z0-9\\._]+)(\s+)?([^\n]*)?(\n)?(.*)?$/;

var _config;
var _loadedModules = {};

function shellRequire(name) {
  var module = _loadedModules[name];
  if (module) {
    return module;
  }

  if (_knownModules[name]) {
    module = require(name);
  }
  else {
    var modulePath = path.join(_config.modulesPath, 'node_modules', name);
    module = require(modulePath);
  }

  if (module) {
    _loadedModules[name] = module;
  }

  return module;
};

var _state = {
  Buffer: Buffer,
  console: console,
  global: _state,
  require: shellRequire
};
var _context = vm.createContext(_state);

function evaluate(text, evaluationId) {
  if (text.charAt(0) === '%') {
    return evaluateCommand(text, evaluationId);
  }
  else {
    return evaluateCode(text, evaluationId);
  }
}

function evaluateCode(code, evaluationId) {
  return vm.runInContext(code, _context, 'code');
}

function evaluateCommand(text, evaluationId) {
  var match = _commandPattern.exec(text);
  if (!match) {
    // TODO: Custom error type
    throw new Error('Invalid command syntax.');
  }

  var commandName = match[1];
  var commandArgs = match[3].trim().split(' ');
  var commandData = match[5];

  // TODO: Generalize
  if (commandName == 'module') {
    if (commandArgs.length != 1) {
      throw new Error('Expected module name argument');
    }

    npm.commands.install(_config.modulesPath, commandArgs, function() { });
  }
}

function createShell(config, callback) {
  _config = config;

  var shell = {
    evaluate: evaluate
  };

  npm.load(function() {
    callback(shell);
  });
}

module.exports = {
  create: createShell
};
