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
// queue.js
// Implements the message handling queue.
//

var display = require('./display'),
    evaluation = require('./evaluation'),
    messages = require('./messages');

var _session;
var _messages;
var _idle;

// Adds a message to the queue
function addMessage(message) {
  var text = message.content ? message.content.code.trim() : '';
  if (!text) {
    return;
  }

  message.content.code = text;
  _messages.push(message);

  // If there is no message already being processed, go ahead and process this message
  // immediately.
  if (_idle) {
    processNextMessage();
  }
}

// Processes execute requests to produce an execute reply message, as well as related messages
// to send back display data, stdout/stderr streams, and busy/idle messages.
function processMessage(message) {
  var complete = false;
  function outputHandler(name, str) {
    if (!complete) {
      var streamMessage = messages.stream(message, name, str);
      messages.write(streamMessage, _session.io, _session.signer);
    }
  }

  var currentEvaluation = evaluation.create(_session.evaluator, outputHandler);
  var result = currentEvaluation.execute(message.content.code);

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

    if (error) {
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
    }
    else {
      error = new Error('Error');
    }

    // Send the execute reply indicating error
    var replyMessage = messages.error(message, currentEvaluation.counter, error, traceback);
    messages.write(replyMessage, _session.shell, _session.signer);
  })
  .fin(function() {
    // Finally process the next message
    processNextMessage(message);
  })
  .done();
}

function processNextMessage(lastMessage) {
  var message = _messages.shift();
  if (message) {
    if (_idle) {
      // State transitioning from idle to busy
      _idle = false;

      // Send the busy message
      var busyMessage = messages.status(message, /* busy */ true);
      messages.write(busyMessage, _session.io, _session.signer);
    }

    processMessage(message);
  }
  else {
    if (!_idle) {
      // State transitioning from busy back to idle, because there was no message to be
      // processed.
      _idle = true;

      // Send the idle message
      var idleMessage = messages.status(lastMessage, /* busy */ false);
      messages.write(idleMessage, _session.io, _session.signer);
    }
  }
}

// Creates the message handling queue associated with the kernel session.
function createQueue(session) {
  _session = session;
  _messages = [];
  _idle = true;

  return {
    add: addMessage
  };
}


module.exports = {
  create: createQueue
};
