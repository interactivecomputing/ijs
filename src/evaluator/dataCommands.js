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

function dataCommand(shell, args, data, evaluationId, dataProcessor) {
  var deferred = shell.runtime.q.defer();
  if (args.source) {
    shell.runtime.request.get(args.source, function(e, response, body) {
      if (e || (response.statusCode != 200)) {
        deferred.reject(e || shell.createError('Failed request'));
      }
      else {
        deferred.resolve(dataProcessor(response.body));
      }
    });
  }
  else {
    deferred.resolve(dataProcessor(data));
  }

  return deferred.promise.then(function(data) {
    shell.state[args.name] = data;

    // Append a variable declaration for the name we just set to the same json data.
    shell.appendCode(util.format('var %s = %s;', args.name, data));

    return args.show ? data : undefined;
  });
}

function dataCommandParser(parser, help) {
  return parser
    .help(help)
    .option('name', {
      abbr: 'n',
      full: 'name',
      metavar: 'variable',
      type: 'string',
      required: true,
      help: 'the variable that will be assigned'
    })
    .option('source', {
      abbr: 's',
      full: 'src',
      metavar: 'url',
      type: 'string',
      help: 'the URL to request'
    })
    .option('show', {
      flag: true,
      default: false,
      help: 'whether the data should be displayed as well'
    });
}


// Implements the %%text command.
// This command can be used to initialize a string variable containing a span of literal text.
// The text does not have to be specified as a string, i.e. quoted and escaped.
function textCommand(shell, args, data, evaluationId) {
  return dataCommand(shell, args, data, evaluationId, function(value) {
    return value;
  });
}
textCommand.options = function(parser) {
  return dataCommandParser(parser, 'Creates a string variable from the specified text.');
}


// Implements the %%json command.
// This command can be used to initialize a variable containing a plain old javascript object
// parsed from JSON text.
function jsonCommand(shell, args, data, evaluationId) {
  return dataCommand(shell, args, data, evaluationId, function(value) {
    return JSON.parse(value);
  });
}
jsonCommand.options = function(parser) {
  return dataCommandParser(parser, 'Creates an object variable from the specified JSON text.');
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
