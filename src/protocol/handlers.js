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

var messages = require('./messages'),
    queue = require('./queue');

var _session;
var _queue;

// Handles the kernel info request to produce a kernel info response.
function kernelInfoHandler(message) {
  var infoMessage = messages.kernelInfoResponse(message);
  messages.write(infoMessage, _session.shell, _session.signer);
}

// Handles the kernel shutdown message. It simply kills the current process.
function shutdownHandler(message) {
  process.exit(0);
}

// Handles execute requests by queuing them into the proessing queue.
function executeHandler(message) {
  _queue.add(message);
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
  _queue = queue.create(session);

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
