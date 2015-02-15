// evaluation.js
//

var streams = require('./streams');

var _evaluationCounter = 0;

function Evaluation(evaluator, streamHandler) {
  _evaluationCounter++;

  this._counter = _evaluationCounter;
  this._evaluator = evaluator;
  this._streamHandler = streamHandler;

  this._stdout = null;
  this._stderr = null;

  this.complete = false;
}

Evaluation.prototype.start = function(text) {
  this._stdout = streams.stdout(this._streamHandler);
  this._stderr = streams.stderr(this._streamHandler);

  return this._evaluator.evaluate(text, this._counter);
}

Evaluation.prototype.end = function(result, error) {
  this._stdout.restore();
  this._stderr.restore();

  this.complete = true;
}

function createEvaluation(evaluator, streamHandler) {
  return new Evaluation(evaluator, streamHandler);
}

module.exports = {
  create: createEvaluation
};
