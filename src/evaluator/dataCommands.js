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
// dataCommands.js
// Implements various commands (aka line and cell magics) available within the shell.
//

var util = require('util');


// Implements the %%text command.
// This command can be used to initialize a string variable containing a span of literal text.
// The text does not have to be specified as a string, i.e. quoted and escaped.
function textCommand(shell, args, data, evaluationId) {
  // Declare a specific named value (or update an existing declaration) with the data
  // associated with the command.
  shell.state[args.name] = data;

  // Append a variable declaration for the name we just set to a string placeholder.
  shell.appendCode(util.format('var %s = "";', args.name));
}
textCommand.options = function(parser) {
  return parser
    .help('Creates a string variable from the specified text.')
    .option('name', {
      abbr: 'n',
      full: 'name',
      metavar: 'variable',
      type: 'string',
      required: true,
      help: 'the variable that will be assigned'
    });
}


// Implements the %%json command.
// This command can be used to initialize a variable containing a plain old javascript object
// parsed from JSON text.
function jsonCommand(shell, args, data, evaluationId) {
  shell.state[args.name] = JSON.parse(data);

  // Append a variable declaration for the name we just set to the same json data.
  shell.appendCode(util.format('var %s = %s;', args.name, data));
}
jsonCommand.options = function(parser) {
  return parser
    .help('Creates an object from the specified JSON text.')
    .option('name', {
      abbr: 'n',
      full: 'name',
      metavar: 'variable',
      type: 'string',
      required: true,
      help: 'the variable that will be assigned'
    });
}


// Initialize the shell with tne commands defined above, so they are available for use as
// %% magics.
function initialize(shell) {
  shell.registerCommand('text', textCommand);
  shell.registerCommand('json', jsonCommand);
}


module.exports = {
  initialize: initialize
};
