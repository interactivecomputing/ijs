// evaluation.js
//

var Q = require('q');
var streams = require('./streams');

var _evaluationCounter = 0;

function Evaluation(evaluator, streamHandler) {
  _evaluationCounter++;
  this.counter = _evaluationCounter;

  this._evaluator = evaluator;
  this._streamHandler = streamHandler;
}

Evaluation.prototype.execute = function(text, callback) {
  var stdout = streams.stdout(this._streamHandler);
  var stderr = streams.stderr(this._streamHandler);

  var result = undefined;
  var error = null;
  try {
    result = this._evaluator.evaluate(text, this.counter);
  }
  catch(e) {
    error = e;
  }

  var promise = result;
  if ((error === null) ||
      (result === null) || (result === undefined) ||
      (typeof result != 'object') ||
      (typeof result.then != 'function')) {
    var deferred = Q.defer();
    error ? deferred.reject(error) : deferred.resolve(result);

    promise = deferred.promise;
  }

  return promise.fin(function() {
    stdout.restore();
    stderr.restore();
  });
}

function createEvaluation(evaluator, streamHandler) {
  return new Evaluation(evaluator, streamHandler);
}

module.exports = {
  create: createEvaluation
};
