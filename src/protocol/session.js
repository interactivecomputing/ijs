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
// session.js
// This represents a kernel session. It implements the networking aspects of the kernel protocol
// using ZMQ.
//

var util = require('util'),
    zmq = require('zmq');

var signers = require('./signers'),
    messages = require('./messages'),
    handlers = require('./handlers');

var _session = {};

// A helper to create a ZMQ socket (of the specified type) and an optional message handler
// to handle incoming messages.
function createSocket(type, ip, port, messageHandler) {
  var uri = util.format('tcp://%s:%d', ip, port);
  var socket = zmq.createSocket(type);

  socket.bind(uri, function(e) { });
  if (messageHandler) {
    socket.on('message', messageHandler);
  }

  return socket;
}

// The heartbeat message handler. It simply echos the incoming message data.
function heartbeatHandler(data) {
  _heartbeatSocket.send(data);
}

// The default message handler for both the Shell and Control sockets. This dispatches the message
// to the appropriate message handler, based on the type of the message.
function messageHandler() {
  var message = messages.read(arguments, _session.signer);
  if (!message) {
    return;
  }

  var handler = _session.handlers[message.header.msg_type];
  if (handler) {
    handler(message);
  }
}

// Runs the session by creating the sockets, and sets up message handlers.
function runSession(evaluator, config) {
  _session.signer = signers.create(config.signature_scheme, config.key);
  _session.io = createSocket('pub', config.ip, config.iopub_port);
  _session.shell = createSocket('xrep', config.ip, config.shell_port, messageHandler);
  _session.control = createSocket('xrep', config.ip, config.control_port, messageHandler);

  _session.evaluator = evaluator;
  _session.handlers = handlers.create(_session);

  createSocket('rep', config.ip, config.hb_port, heartbeatHandler);
}


module.exports = {
  run: runSession
};
