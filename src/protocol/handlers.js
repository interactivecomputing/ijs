// handlers.js
//

var display = require('./display'),
    evaluation = require('./evaluation'),
    messages = require('./messages');

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
      var data = display.data(value);
      var dataMessage = messages.data(message, data);
      messages.write(dataMessage, _session.io, _session.signer);
    }

    var replyMessage = messages.success(message, currentEvaluation.counter);
    messages.write(replyMessage, _session.shell, _session.signer);
  })
  .fail(function(error) {
    var traceback = null;

    var errorOutput;
    if (error.trace === false) {
      errorOutput = error.message;
    }
    else {
      var trace = _session.evaluator.createTrace(error);
      errorOutput = trace.join('\n');

      traceback = trace.splice(1).map(function(s) { return s.trim().substr(3); });
    }

    var errorMessage = messages.stream(message, 'stderr', errorOutput);
    messages.write(errorMessage, _session.io, _session.signer);

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
