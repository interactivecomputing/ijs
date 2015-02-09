// handlers.js
//

var Message = require('./message');

var _session;

function kernelInfoHandler(message) {
  var infoMessage = Message.kernelInfoResponse(message);
  Message.write(infoMessage, _session.shell, _session.signer);
}

function shutdownHandler(message) {
}

function executeHandler(message) {
  var code = message.content ? message.content.code : '';
  if (!code) {
    return;
  }

  var busyMessage = Message.status(message, /* busy */ true);
  Message.write(busyMessage, _session.io, _session.signer);

  var result = _session.evaluator.evaluate(code) || '';

  var dataMessage = Message.data(message, { 'text/plain': result.toString() });
  Message.write(dataMessage, _session.io, _session.signer);

  var replyMessage = Message.executeSuccessResponse(message, 1);
  Message.write(replyMessage, _session.shell, _session.signer);

  var idleMessage = Message.status(message, /* busy */ false);
  Message.write(idleMessage, _session.io, _session.signer);
}

function createHandlers(session) {
  _session = session;

  var handlers = {};
  handlers[Message.names.kernelInfoRequest] = kernelInfoHandler;
  handlers[Message.names.shutdownRequest] = shutdownHandler;
  handlers[Message.names.executeRequest] = executeHandler;

  return handlers;
}

module.exports = {
  create: createHandlers
};
