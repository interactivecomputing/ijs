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
// streams.js
// Provides functionality to capture a standard output stream.
//

// Captures a specific stream, and invokes the specified callback with the text written to the
// stream instead. It returns a function that can be used to restore the captured stream.
function captureStream(name, callback) {
  var stream = process[name];
  var originalWrite = stream.write;

  stream.write = function(str) {
    callback(name, str);
  };

  return {
    restore: function() {
      stream.write = originalWrite;
    }
  };
}

// Helper to capture the stdout stream.
function captureStdout(callback) {
  return captureStream('stdout', callback);
}

// Helper to capture the stderr stream.
function captureStderr(callback) {
  return captureStream('stderr', callback);
}


module.exports = {
  stderr: captureStderr,
  stdout: captureStdout
};
