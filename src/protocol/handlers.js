// handlers.js
//

var messages = require('./messages'),
    evaluation = require('./evaluation');

var _session;

function kernelInfoHandler(message) {
  var infoMessage = messages.kernelInfoResponse(message);
  messages.write(infoMessage, _session.shell, _session.signer);
}

function shutdownHandler(message) {
  process.exit(0);
}

function executeHandler(message) {
  var text = message.content ? message.content.code.trim() : '';
  if (!text) {
    return;
  }

  var currentEvaluation = null;

  function outputHandler(name, str) {
    if (!currentEvaluation.complete) {
      var streamMessage = messages.stream(message, name, str);
      messages.write(streamMessage, _session.io, _session.signer);
    }
  }

  var busyMessage = messages.status(message, /* busy */ true);
  messages.write(busyMessage, _session.io, _session.signer);

  var result = null;
  var error = null;
  try {
    currentEvaluation = evaluation.create(_session.evaluator, outputHandler);
    result = currentEvaluation.start(text);
  }
  catch(e) {
    error = e;
  }
  finally {
    if (currentEvaluation) {
      currentEvaluation.end(result, error);
    }
  }

  if (result !== undefined) {
    var dataMessage = messages.data(message, { 'text/plain': result.toString() });
    messages.write(dataMessage, _session.io, _session.signer);
  }

  var replyMessage = error ? messages.error(message, this._counter, error) :
                             messages.success(message, this._counter);
  messages.write(replyMessage, _session.shell, _session.signer);

  var idleMessage = messages.status(message, /* busy */ false);
  messages.write(idleMessage, _session.io, _session.signer);
}

function createHandlers(session) {
  _session = session;

  var handlers = {};
  handlers[messages.names.kernelInfoRequest] = kernelInfoHandler;
  handlers[messages.names.shutdownRequest] = shutdownHandler;
  handlers[messages.names.executeRequest] = executeHandler;

  return handlers;
}

module.exports = {
  create: createHandlers
};
