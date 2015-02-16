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

  var complete = false;
  function outputHandler(name, str) {
    if (!complete) {
      var streamMessage = messages.stream(message, name, str);
      messages.write(streamMessage, _session.io, _session.signer);
    }
  }

  var busyMessage = messages.status(message, /* busy */ true);
  messages.write(busyMessage, _session.io, _session.signer);

  var currentEvaluation = evaluation.create(_session.evaluator, outputHandler);
  var result = currentEvaluation.execute(text);

  result.then(function(value) {
    if ((value !== undefined) && (value !== null)) {
      value = value.toString();

      var dataMessage = messages.data(message, { 'text/plain': value });
      messages.write(dataMessage, _session.io, _session.signer);
    }

    var replyMessage = messages.success(message, currentEvaluation.counter);
    messages.write(replyMessage, _session.shell, _session.signer);
  })
  .fail(function(error) {
    var trace = _session.evaluator.createTrace(error);
    var traceMessage = messages.stream(message, 'stderr', trace.join('\n'));
    messages.write(traceMessage, _session.io, _session.signer);

    var traceback = trace.splice(1).map(function(s) { return s.trim().substr(3); });
    var replyMessage = messages.error(message, currentEvaluation.counter, error, traceback);
    messages.write(replyMessage, _session.shell, _session.signer);
  })
  .fin(function() {
    var idleMessage = messages.status(message, /* busy */ false);
    messages.write(idleMessage, _session.io, _session.signer);
  })
  .done();
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
