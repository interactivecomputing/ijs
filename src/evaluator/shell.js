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
    // TODO: Support for installing modules
    // npm.commands.install(_config.modulesPath, [name], function() { });
    var modulePath = path.join(_config.modulesPath, name);
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

function evaluate(code, evaluationId) {
  return vm.runInContext(code, _context, 'code');
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
