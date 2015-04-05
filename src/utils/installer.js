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
// installer.js
// Provides functionality to install modules via npm.
//

var npm = require('npm');
var streams = require('./streams');

function installModule(module, installPath, quiet, callback) {
  var stdout = null;
  if (quiet) {
    stdout = streams.stdout(function() {});
  }

  var npmOptions = {
    // where modules should get installed
    prefix: installPath,

    // turn off npm spew, as well as its progress indicator
    loglevel: 'silent',
    spin: false,

    // make any other output (the list of installed modules) usable within the shell
    color: false,
    unicode: false
  };
  npm.load(npmOptions, function() {
    npm.commands.install([ module ], function(error) {
      if (quiet) {
        stdout.restore();
      }

      callback(error);
    });
  });
}

module.exports = {
  install: installModule
};
