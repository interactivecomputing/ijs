// message.js
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
  status: 'status',
  displayData: 'display_data',
  stream: 'stream'
};

function createMessage(identities, header, parentHeader, metadata, content) {
  return {
    identities: identities,
    header: header,
    parentHeader: parentHeader,
    metadata: metadata,
    content: content
  };
}

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

function createKernelInfoResponseMessage(parentMessage) {
  var content = {
    language: 'javascript',
    language_version: [1,0],
    protocol_version: [4,1]
  };
  return newMessage(_messageNames.kernelInfoResponse, parentMessage, content);
}

function createExecuteErrorResponseMessage(parentMessage, executionCount, error) {
  var stack = error.stack || '';
  var trace = stack.split('\n').splice(1).map(function(s) {
    return s.trim().substr(3);
  });

  var content = {
    status: 'error',
    execution_count: executionCount,
    ename: error.constructor.name,
    evalue: error.toString(),
    traceback: trace
  };

  return newMessage(_messageNames.executeResponse, parentMessage, content);
}

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

function createDataMessage(parentMessage, representations) {
  var content = {
    data: representations
  };

  return newMessage(_messageNames.displayData, parentMessage, content);
}

function createStreamMessage(parentMessage, streamName, data) {
  var content = {
    name: streamName,
    data: data
  };

  return newMessage(_messageNames.stream, parentMessage, content);
}

function createStatusMessage(parentMessage, busy) {
  var content = {
    execution_state: busy ? 'busy' : 'idle'
  };

  return newMessage(_messageNames.status, parentMessage, content);
}

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
  data: createDataMessage,
  stream: createStreamMessage,
  read: readMessage,
  write: writeMessage
};
