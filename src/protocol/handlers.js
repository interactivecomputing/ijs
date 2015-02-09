// handlers.js
//

var Message = require('./message');

var _session;

function kernelInfoHandler(message) {
  var infoMessage = Message.kernelInfoResponse(message);
  Message.write(infoMessage, _session.shell, _session.signer);
}

function shutdownHandler(message) {
  process.exit(0);
}

function executeHandler(message) {
  var code = message.content ? message.content.code : '';
  if (!code) {
    return;
  }

  var busyMessage = Message.status(message, /* busy */ true);
  Message.write(busyMessage, _session.io, _session.signer);

  var result = null;
  var error = null;
  try {
    result = _session.evaluator.evaluate(code);
    if (result === undefined) {
      result = '';
    }
  }
  catch(e) {
    error = e;
  }

  var replyMessage;
  if (!error) {
    replyMessage = Message.success(message, 1);

    var dataMessage = Message.data(message, { 'text/plain': result.toString() });
    Message.write(dataMessage, _session.io, _session.signer);
  }
  else {
    replyMessage = Message.error(message, 1, error);
  }
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
