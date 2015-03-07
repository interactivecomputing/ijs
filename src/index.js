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
// index.js
// Entrypoint for the kernel.
//

var fs = require('fs'),
    nomnom = require('nomnom');

var Session = require('./protocol/session'),
    Shell = require('./evaluator/shell');

// The main method which parses input arguments, creates a Shell providing evaluation functionality
// and the Session object to handle the kernel protocol.
function main() {
  var parser = nomnom();
  parser.script('ijs')
        .nocolors()
        .printer(function(s, code) {
          console.log(s);
          if (code) {
            process.exit(code);
          }
        })
        .option('version', {
          abbr: 'v',
          flag: true,
          help: 'print version and exit',
          callback: function() {
            console.log('0.1.0');
            process.exit(0);
          }
        })
        .option('modulesPath', {
          abbr: 'm',
          full: 'modules',
          metavar: 'path',
          type: 'string',
          required: true,
          help: 'path that will contain installed node modules',
          callback: function(modulesPath) {
            if (!fs.existsSync(modulesPath) || !fs.statSync(modulesPath).isDirectory()) {
              return 'expected an existing directory for the modules option';
            }
            return null;
          }
        })
        .option('extensionsPath', {
          abbr: 'e',
          full: 'extensions',
          metavar: 'path',
          type: 'string',
          required: true,
          help: 'path that will contain installed extensions',
          callback: function(extensionsPath) {
            if (!fs.existsSync(extensionsPath) || !fs.statSync(extensionsPath).isDirectory()) {
              return 'expected an existing directory for the extensions option';
            }
            return null;
          }
        })
        .option('connectionFile', {
          position: 0,
          required: true,
          help: 'path to file containing kernel connection information'
        });
  var options = parser.parse(process.argv.slice(2));

  if (options) {
    var shellConfig = {
      modulesPath: options.modulesPath,
      extensionsPath: options.extensionsPath
    };

    var connectionConfig = JSON.parse(fs.readFileSync(options.connectionFile,
                                                      { encoding: 'utf8' }));

    Shell.create(shellConfig, function(shell) {
      Session.run(shell, connectionConfig);
    });
  }
}

main();
