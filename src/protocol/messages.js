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
// messages.js
// This module provides functionality to create new messages as well as the ability to
// read and write messages from and to a transport socket.
//

var uuid = require('node-uuid');

var _messageDelimiter = '<IDS|MSG>';
var _messageNames = {
  kernelInfoRequest: 'kernel_info_request',
  kernelInfoResponse: 'kernel_info_response',
  shutdownRequest: 'shutdown_request',
  shutdownResponse: 'shutdown_response',
  executeRequest: 'execute_request',
  executeResponse: 'execute_response',
  completeRequest: 'complete_request',
  completeResponse: 'complete_response',
  status: 'status',
  displayData: 'display_data',
  stream: 'stream'
};

// Helper method to create a message object from its independent pieces.
function createMessage(identities, header, parentHeader, metadata, content) {
  return {
    identities: identities,
    header: header,
    parentHeader: parentHeader,
    metadata: metadata,
    content: content
  };
}

// Creates a new message of the specified type, in association to a parent (incoming message)
// and optional metadata and content.
function newMessage(type, parentMessage, content, metadata) {
  var header = {
    msg_type: type,
    msg_id: uuid.v4(),
    session: parentMessage.header.session,
    username: parentMessage.header.username
  };

  metadata = metadata || {};
  content = content || {};
  return createMessage(parentMessage.identities, header, parentMessage.header,
                       metadata, content);
}

// Creates a kernel info response message.
function createKernelInfoResponseMessage(parentMessage) {
  var content = {
    language: 'javascript',
    language_version: [1,0],
    protocol_version: [4,1]
  };
  return newMessage(_messageNames.kernelInfoResponse, parentMessage, content);
}

// Creates an error execution reply message.
function createExecuteErrorResponseMessage(parentMessage, executionCount, error, traceback) {
  var content = {
    status: 'error',
    execution_count: executionCount,
    ename: error.constructor.name,
    evalue: error.toString(),
    traceback: traceback
  };

  return newMessage(_messageNames.executeResponse, parentMessage, content);
}

// Creates a success execution reply message.
function createExecuteSuccessResponseMessage(parentMessage, executionCount, metadata) {
  var content = {
    status: 'ok',
    execution_count: executionCount,
    payload: [],
    user_variables: {},
    user_expressions: {}
  };

  return newMessage(_messageNames.executeResponse, parentMessage, content, metadata);
}

// Create a completions list reply message
function createCompleteInfoResponseMessage(parentMessage, completions, start, end, info, metadata) {
  var content = {
    status: 'ok',
    matches: completions,
    cursor_start: start,
    cursor_end: end,
    metadata: info
  };

  return newMessage(_messageNames.completeResponse, parentMessage, content, metadata);
}

// Creates a display data message for sending results of an execution.
function createDataMessage(parentMessage, representations) {
  var content = {
    data: representations
  };

  return newMessage(_messageNames.displayData, parentMessage, content);
}

// Creates a stream message for sending text written to stdout/stderr streams.
function createStreamMessage(parentMessage, streamName, data) {
  var content = {
    name: streamName,
    data: data
  };

  return newMessage(_messageNames.stream, parentMessage, content);
}

// Creates a status message to communicate kernel idle/busy status.
function createStatusMessage(parentMessage, busy) {
  var content = {
    execution_state: busy ? 'busy' : 'idle'
  };

  return newMessage(_messageNames.status, parentMessage, content);
}

// Helper to read in a message from incoming message data.
function readMessage(socketData, signer) {
  var identities = socketData[0];
  var signature = socketData[2].toString();
  var header = socketData[3];
  var parentHeader = socketData[4];
  var metadata = socketData[5];
  var content = socketData[6];

  if (!signer.validate(signature, [ header, parentHeader, metadata, content ])) {
    return null;
  }

  return createMessage(identities,
                       JSON.parse(header),
                       JSON.parse(parentHeader),
                       JSON.parse(metadata),
                       JSON.parse(content));
}

// Helper to write out a message to as outgoing message data.
function writeMessage(message, socket, signer) {
  var header = JSON.stringify(message.header);
  var parentHeader = JSON.stringify(message.parentHeader);
  var metadata = JSON.stringify(message.metadata);
  var content = JSON.stringify(message.content);

  var signature = signer.sign([ header, parentHeader, metadata, content ]);

  var socketData = [
    message.identities,
    '<IDS|MSG>',
    signature,
    header,
    parentHeader,
    metadata,
    content
  ];
  socket.send(socketData);
}


module.exports = {
  names: _messageNames,
  kernelInfoResponse: createKernelInfoResponseMessage,
  status: createStatusMessage,
  error: createExecuteErrorResponseMessage,
  success: createExecuteSuccessResponseMessage,
  completions: createCompleteInfoResponseMessage,
  data: createDataMessage,
  stream: createStreamMessage,
  read: readMessage,
  write: writeMessage
};
