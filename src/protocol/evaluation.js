// Copyright 2015 Interactive Computing project (https://github.com/interactivecomputing).
// All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
// except in compliance with the License. You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software distributed under the
// License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
// either express or implied. See the License for the specific language governing permissions
// and limitations under the License.
//
// evaluation.js
// Represents a single evaluation within the kernel.
//

var Q = require('q');
var streams = require('./streams');

var _evaluationCounter = 0;

// An Evaluation object that serves as context for a given code execution within the kernel.
// It sets up stdout/stderr capturing and restoring as well as async completion of the evaluation.
function Evaluation(evaluator, streamHandler) {
  _evaluationCounter++;
  this.counter = _evaluationCounter;

  this._evaluator = evaluator;
  this._streamHandler = streamHandler;
}

// Executes the specified text, and returns a promise that is resolved or rejected with the result
// or the error raised during evaluation.
Evaluation.prototype.execute = function(text) {
  // Capture the streams
  var stdout = streams.stdout(this._streamHandler);
  var stderr = streams.stderr(this._streamHandler);

  var result = undefined;
  var error = null;
  try {
    // Let the evaluator do its thing to produce a result
    result = this._evaluator.evaluate(text, this.counter);
  }
  catch(e) {
    error = e;
  }

  // Convert the result into a promise (if it isn't already one). Both sync and async results
  // are handled in the same way.
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
    // Ensure that the streams are restored once the promise has been resolved or rejected.
    // This implies that the streams remain in captured state during async work if the evaluation
    // results in a promise that asynchronously completes.
    stdout.restore();
    stderr.restore();
  });
}


// Creates a new Evaluation object given an evaluator and an output handler.
function createEvaluation(evaluator, streamHandler) {
  return new Evaluation(evaluator, streamHandler);
}


module.exports = {
  create: createEvaluation
};
