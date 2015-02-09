// streams.js
//

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

function captureStdout(callback) {
  return captureStream('stdout', callback);
}

function captureStderr(callback) {
  return captureStream('stderr', callback);
}

module.exports = {
  stderr: captureStderr,
  stdout: captureStdout
};
