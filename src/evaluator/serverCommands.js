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
// commands.js
// Implements various commands (aka line and cell magics) available within the shell.
//

var util = require('util');


// Implements the %server command
// This command can be used to control the server associated with the shell.
function serverCommand(shell, args, data, evaluationId) {
  var command = args[0];

  try {
    if (command == 'start') {
      shell.server.start(args.port)
    }
    else if (command == 'stop') {
      shell.server.stop();
    }
  }
  catch (e) {
    throw shell.createError(e.message);
  }
}
serverCommand.options = function(parser) {
  parser.command('start')
        .help('Starts the web server')
        .option('port', {
          abbr: 'p',
          full: 'port',
          metavar: 'number',
          type: 'number',
          required: true,
          help: 'the port on which the server should listen'
        });
  parser.command('stop');

  return parser;
}

// Initialize the shell with tne commands defined above, so they are available for use as
// %% magics.
function initialize(shell) {
  shell.registerCommand('server', serverCommand);
}


module.exports = {
  initialize: initialize
};
