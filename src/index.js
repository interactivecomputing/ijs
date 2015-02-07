// index.js
//

var fs = require('fs'),
    util = require('util'),
    vm = require('vm'),
    zmq = require('zmq');

var Signer = require('./protocol/signer'),
    Message = require('./protocol/message');

function createSocketUri(ip, port) {
  return util.format('tcp://%s:%d', ip, port);
}

function createSocket(type, ip, port, messageHandler) {
  var uri = util.format('tcp://%s:%d', ip, port);
  var socket = zmq.createSocket(type);

  socket.bind(uri, function(e) { });
  if (messageHandler) {
    socket.on('message', messageHandler);
  }

  return socket;
}

var state = {};
var context = vm.createContext(state);

var config = JSON.parse(fs.readFileSync(process.argv[2], { encoding: 'utf8' }));
var signer = Signer.create(config.signature_scheme, config.key);

// Create the heartbeat socket - a simple req/rep zmq socket, which echoes
// what it is sent.
var hbSocket = createSocket('rep', config.ip, config.hb_port,
                            function(data) { hbSocket.send(data); });

// Create the publish socket to broadcast outgoing messages.
var pubSocket = createSocket('pub', config.ip, config.iopub_port);

// Create the shell socket which handles incoming shell messages.
var shellSocket = createSocket('xrep', config.ip, config.shell_port,
  function() {
    var result = '';

    var message = Message.read(arguments, signer);
    var code = message.content ? message.content.code : '';

    if (code && code.length) {
      result = vm.runInContext(code, context);
      result = result || '';
    }

    var outputMessage = Message.create('pyout', message, null, {
      data: { 'text/plain': result.toString() }
    });
    outputMessage.write(pubSocket, signer);

    var replyMessage = Message.create('execute_reply', message, null, {
      content: { execution_count: 1 },
    });
    replyMessage.write(shellSocket, signer);
  });
