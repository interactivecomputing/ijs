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
// handlers.js
// Implements message handlers supported by this kernel to process incoming messages and
// generate out-going messages.
//

var display = require('./display'),
    evaluation = require('./evaluation'),
    messages = require('./messages');

var _session;

// Handles the kernel info request to produce a kernel info response.
function kernelInfoHandler(message) {
  var infoMessage = messages.kernelInfoResponse(message);
  messages.write(infoMessage, _session.shell, _session.signer);
}

// Handles the kernel shutdown message. It simply kills the current process.
function shutdownHandler(message) {
  process.exit(0);
}

// Handles execute requests to produce an execute reply message, as well as related messages
// to send back display data, stdout/stderr streams, and busy/idle messages.
// TODO: Switch the implementation to enqueue the work. This will allow for a few things:
//       - Sending fewer busy/idle messages, specifically only at the transition points
//         rather than for every incoming execute request.
//       - Have more control over when execution starts... specifically not start executing
//         something if the previous request is still being completed as a result of async work.
function executeHandler(message) {
  var text = message.content ? message.content.code.trim() : '';
  if (!text) {
    return;
  }

  var complete = false;
  function outputHandler(name, str) {
    if (!complete) {
      var streamMessage = messages.stream(message, name, str);
      messages.write(streamMessage, _session.io, _session.signer);
    }
  }

  // Send the busy message
  var busyMessage = messages.status(message, /* busy */ true);
  messages.write(busyMessage, _session.io, _session.signer);

  var currentEvaluation = evaluation.create(_session.evaluator, outputHandler);
  var result = currentEvaluation.execute(text);

  result.then(function(value) {
    // Success ... send the result as display data if there was a result (i.e. don't send back
    // data to render null or undefined)
    if ((value !== undefined) && (value !== null)) {
      var data = display.data(value);
      var dataMessage = messages.data(message, data);
      messages.write(dataMessage, _session.io, _session.signer);
    }

    // Send the execute reply indicating success
    var replyMessage = messages.success(message, currentEvaluation.counter);
    messages.write(replyMessage, _session.shell, _session.signer);
  })
  .fail(function(error) {
    var traceback = null;

    // Send a trace for the error
    var errorOutput;
    if (error.trace === false) {
      // If an error has been marked as trace suppress, just use the message. This is to
      // communicate error in user's input as opposed to error raised during execution.
      errorOutput = error.message;
    }
    else {
      var trace = _session.evaluator.createTrace(error);
      errorOutput = trace.join('\n');

      // The traceback field of the reply should not contain the error message,
      // just the stack trace.
      traceback = trace.splice(1).map(function(s) { return s.trim().substr(3); });
    }

    var errorMessage = messages.stream(message, 'stderr', errorOutput);
    messages.write(errorMessage, _session.io, _session.signer);

    // Send the execute reply indicating error
    var replyMessage = messages.error(message, currentEvaluation.counter, error, traceback);
    messages.write(replyMessage, _session.shell, _session.signer);
  })
  .fin(function() {
    // Finally send the idle message
    var idleMessage = messages.status(message, /* busy */ false);
    messages.write(idleMessage, _session.io, _session.signer);
  })
  .done();
}

function completeHandler(message) {
  var promise = _session.evaluator.complete(message.content.text, message.content.cursor_pos);
  promise.then(function(result) {
    var replyMessage = messages.completions(message, result.prefix, result.completions);
    messages.write(replyMessage, _session.shell, _session.signer);
  });
}

// Creates the message handlers associated with the kernel session.
function createHandlers(session) {
  _session = session;

  var handlers = {};
  handlers[messages.names.kernelInfoRequest] = kernelInfoHandler;
  handlers[messages.names.shutdownRequest] = shutdownHandler;
  handlers[messages.names.executeRequest] = executeHandler;
  handlers[messages.names.completeRequest] = completeHandler;

  return handlers;
}


module.exports = {
  create: createHandlers
};
