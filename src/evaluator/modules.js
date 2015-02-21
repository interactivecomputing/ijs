// modules.js
//

var npm = require('npm'),
    path = require('path'),
    q = require('q');

var error = require('./error');

// List of built-in and custom modules available from the shell
// without needing to first install.
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
  zlib: 'zlib',

  async: 'async',
  request: 'request'
};


function moduleCommand(shell, args, data, evaluationId) {
  var deferred = q.defer();

  npm.commands.install(shell.config.modulesPath, [ args.name ], function(error) {
    if (error) {
      deferred.reject(error);
    }
    else {
      shell.installedModules[args.name] = true;
      deferred.resolve();
    }
  });
  return deferred.promise;
}
moduleCommand.options = function(parser) {
  return parser
    .help('Installs the specified module and makes it available for use')
    .option('name', {
      position: 0,
      required: true,
      help: 'the name of the module to install'
    });
}


function modulesCommand(shell, args, data, evaluationId) {
  var names = [];
  for (var n in shell.installedModules) {
    names.push(n);
  }

  console.log(names.join('\n'));
}
modulesCommand.options = function(parser) {
  return parser.help('Lists the set of installed modules.');
}


function customRequire(shell, name) {
  var module = shell.requiredModules[name];
  if (module) {
    return module;
  }

  if (_knownModules[name]) {
    module = require(name);
  }
  else if (shell.installedModules[name]) {
    var modulePath = path.join(shell.config.modulesPath, 'node_modules', name);
    module = require(modulePath);
  }

  if (module) {
    shell.requiredModules[name] = module;
  }
  else {
    throw error.create('Unknown module "%s". Make sure it has been installed via %module first.',
                       name);
  }

  return module;
};


function initialize(shell, callback) {
  shell.requiredModules = {};
  shell.installedModules = {};

  shell.require = function(name) {
    return customRequire(shell, name);
  };

  shell.registerCommand('module', moduleCommand);
  shell.registerCommand('modules', modulesCommand);

  var npmOptions = {
    prefix: shell.config.modulesPath,
    loglevel: 'silent',
    spin: false,
    color: false,
    unicode: false
  };
  npm.load(npmOptions, function() {
    callback();
  });
}

module.exports = {
  initialize: initialize
};
