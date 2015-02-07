// session.js
//

var fs = require('fs'),
    util = require('util'),
    zmq = require('zmq');

var Signer = require('./signer'),
    Message = require('./message');

var _signer;
var _heartbeatSocket;
var _iopubSocket;
var _shellSocket;

var _evaluator;

function createSocket(type, ip, port, messageHandler) {
  var uri = util.format('tcp://%s:%d', ip, port);
  var socket = zmq.createSocket(type);

  socket.bind(uri, function(e) { });
  if (messageHandler) {
    socket.on('message', messageHandler);
  }

  return socket;
}

function heartbeatHandler(data) {
  _heartbeatSocket.send(data);
}

function shellHandler() {
  var message = Message.read(arguments, _signer);
  var code = message.content ? message.content.code : '';

  var result = '';
  if (code && code.length) {
    result = _evaluator.evaluate(code);
    result = result || '';
  }

  var outputMessage = Message.create('pyout', message, null, {
    data: { 'text/plain': result.toString() }
  });
  outputMessage.write(_iopubSocket, _signer);

  var replyMessage = Message.create('execute_reply', message, null, {
    content: { execution_count: 1 },
  });
  replyMessage.write(_shellSocket, _signer);
}

function runSession(evaluator, connectionFile) {
  _evaluator = evaluator;

  var config = JSON.parse(fs.readFileSync(connectionFile, { encoding: 'utf8' }));

  _signer = Signer.create(config.signature_scheme, config.key);
  _heartbeatSocket = createSocket('rep', config.ip, config.hb_port, heartbeatHandler);
  _iopubSocket = createSocket('pub', config.ip, config.iopub_port);
  _shellSocket = createSocket('xrep', config.ip, config.shell_port, shellHandler);
}

module.exports = {
  run: runSession
};
