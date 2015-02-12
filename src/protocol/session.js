// session.js
//

var util = require('util'),
    zmq = require('zmq');

var Signer = require('./signer'),
    Message = require('./message'),
    Handlers = require('./handlers');

var _session = {};

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

function messageHandler() {
  var message = Message.read(arguments, _session.signer);
  if (!message) {
    return;
  }

  var handler = _session.handlers[message.header.msg_type];
  if (handler) {
    handler(message);
  }
}

function runSession(evaluator, config) {
  _session.signer = Signer.create(config.signature_scheme, config.key);
  _session.io = createSocket('pub', config.ip, config.iopub_port);
  _session.shell = createSocket('xrep', config.ip, config.shell_port, messageHandler);
  _session.control = createSocket('xrep', config.ip, config.control_port, messageHandler);

  _session.evaluator = evaluator;
  _session.handlers = Handlers.create(_session);

  createSocket('rep', config.ip, config.hb_port, heartbeatHandler);
}

module.exports = {
  run: runSession
};
