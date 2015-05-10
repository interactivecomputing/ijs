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
// extensions.js
// This module contains functionality associated with loading shell extensions.
//

var path = require('path');
var installer = require('../utils/installer');

// Implements the %extension command, that can be used to install a specific named
// module as a shell extension, using npm.
function extensionCommand(shell, args, data, evaluationId) {
  var deferred = shell.runtime.q.defer();

  var name = args.name;
  var moduleName = 'ijs.ext.' + name;
  var modulePath = args.path || moduleName;

  installer.install(modulePath, shell.config.userPath, /* quiet */ true, function(error) {
    if (error) {
      deferred.reject(shell.createError('Unable to install extension module "%s"', moduleName));
    }
    else {
      var extensionPath = path.join(shell.config.userPath, 'node_modules', moduleName);
      var extension = require(extensionPath);

      try {
        extension.initialize(shell, function(error, result) {
          if (error) {
            deferred.reject(shell.createError('Error initializing extension'));
          }
          else {
            shell.loadedExtensions[name] = true;
            deferred.resolve(result);
          }
        });
      }
      catch(e) {
        deferred.reject(shell.createError('Error initializing extension'));
      }
    }
  })

  return deferred.promise;
}
extensionCommand.options = function(parser) {
  return parser
    .help('Loads the specified extensions')
    .option('name', {
      position: 0,
      required: true,
      help: 'the name of the extension to install'
    })
    .option('path', {
      abbr: 'p',
      full: 'path',
      metavar: 'path',
      type: 'string',
      required: false,
      help: 'the local path of the extension'
    });
}


// Implements the %extensions command, that can be used to list the names of loaded extensions.
function extensionsCommand(shell, args, data, evaluationId) {
  var names = [];
  for (var n in shell.loadedExtensions) {
    names.push(n);
  }

  console.log(names.join('\n'));
}
extensionsCommand.options = function(parser) {
  return parser.help('Lists the set of loaded extensions.');
}


// Initializes the shell with extensions related functionality.
function initialize(shell) {
  shell.loadedExtensions = {};

  shell.registerCommand('extension', extensionCommand);
  shell.registerCommand('extensions', extensionsCommand);
}


module.exports = {
  initialize: initialize
};
