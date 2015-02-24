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
// modules.js
// This module contains all the functionality associated with using (installing and loading)
// node modules within the shell.
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
  zlib: 'zlib'
};


// Implements the %module command, that can be used to install a specific named
// module, using npm. The module gets installed into 'node_modules' within the path
// specified in configuration.
function moduleCommand(shell, args, data, evaluationId) {
  var deferred = q.defer();

  npm.commands.install([ args.name ], function(error) {
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


// Implements the %modules command, that can be used to list the names of installed modules.
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


// The implementation of the 'require' method that is made available within the shell.
// This satisfies required modules using a combination of known modules (standard and other
// modules available via the shell) and custom modules (previously installed using %module).
function customRequire(shell, name) {
  var module = shell.requiredModules[name];
  if (module) {
    return module;
  }

  if (_knownModules[name]) {
    module = require(name);
  }
  else if (shell.installedModules[name]) {
    // Directly load up a specified custom module from where it would have been installed
    // when using the %module command.
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


// Initializes the shell with module related functionality.
// - The required and installed modules are tracked, and an implementation of a shell-scoped
//   require is created.
// - The %module and %modules commands are also registered with the shell.
// - Finally npm is initialized, so it can later be used to install custom modules.
function initialize(shell, callback) {
  shell.requiredModules = {};
  shell.installedModules = {};

  shell.state.require = function(name) {
    return customRequire(shell, name);
  };

  shell.registerCommand('module', moduleCommand);
  shell.registerCommand('modules', modulesCommand);

  var npmOptions = {
    // where modules should get installed
    prefix: shell.config.modulesPath,

    // turn off npm spew, as well as its progress indicator
    loglevel: 'silent',
    spin: false,

    // make any other output (the list of installed modules) usable within the shell
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
