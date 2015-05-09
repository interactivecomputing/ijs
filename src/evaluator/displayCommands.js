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
// displayCommands.js
// Implements various commands (aka line and cell magics) available within the shell.
//

var util = require('util');


// Implements the %%html command.
// This command simply converts the specified text into an object that is rendered as HTML.
function htmlCommand(shell, args, data, evaluationId) {
  return shell.runtime.data.html(data);
}
htmlCommand.options = function(parser) {
  return parser.help('Creates and renders HTML markup.');
}


// Implements the %%script command.
// This command can be used to execute script on the client, instead of on the server.
function scriptCommand(shell, args, data, evaluationId) {
  return shell.runtime.data.script(data);
}
scriptCommand.options = function(parser) {
  return parser.help('Creates a script object that is executed in the browser.');
}


// Initialize the shell with tne commands defined above, so they are available for use as
// %% magics.
function initialize(shell) {
  shell.registerCommand('html', htmlCommand);
  shell.registerCommand('script', scriptCommand);
}


module.exports = {
  initialize: initialize
};
