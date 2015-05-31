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
var _currentMessage;

// Adds a message to the queue
function addMessage(message) {
  _messages.push(message);
}

function processMessage(message) {
  //code
}

// Creates the message handling queue associated with the kernel session.
function createQueue(session) {
  _session = session;
  _messages = [];

  return {
    add: addMessage
  };
}


module.exports = {
  create: createHandlers
};
