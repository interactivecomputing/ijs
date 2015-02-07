// index.js
//

var fs = require('fs'),
    util = require('util'),
    vm = require('vm'),
    zmq = require('zmq');

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

function readMessage(data) {
  return {
    header: JSON.parse(data[3]),
    parentHeader: JSON.parse(data[4]),
    metadata: JSON.parse(data[5]),
    content: JSON.parse(data[6])
  };
}

function writeMessage(socket, message) {
  var data = [ '', '<IDS|MSG>', '',
               JSON.stringify(message.header),
               JSON.stringify(message.parentHeader),
               JSON.stringify(message.metadata),
               JSON.stringify(message.content) ];
  socket.send(data);
}


var state = {};
var context = vm.createContext(state);

var config = JSON.parse(fs.readFileSync(process.argv[2], { encoding: 'utf8' }));

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

    var message = readMessage(arguments);
    var code = message.content ? message.content.code : '';

    if (code && code.length) {
      result = vm.runInContext(code, context);
      result = result || '';
    }

    writeMessage(pubSocket, {
      header: {
        msg_type: 'pyout',
        msg_id: 1,
        session: message.parentHeader.session
      },
      parentHeader: message.header,
      metadata: {},
      content: {
        data: {
          'text/plain': result.toString()
        }
      }
    });

    writeMessage(shellSocket, {
      header: {
        msg_type: 'execute_reply',
        msg_id: 1,
        session: message.parentHeader.session
      },
      parentHeader: message.header,
      metadata: {},
      content: {
        execution_count: 1
      },
    });
  });

