// message.js
//

var uuid = require('node-uuid');

var DELIMITER = '<IDS|MSG>';

function Message(identities, header, parentHeader, metadata, content) {
  this.identities = identities;
  this.header = header;
  this.parentHeader = parentHeader;
  this.metadata = metadata;
  this.content = content;
}

function createMessage(type, parentMessage, metadata, content) {
  var header = {
    msg_type: type,
    msg_id: uuid.v4(),
    session: parentMessage.header.session,
    username: parentMessage.header.username
  };

  metadata = metadata || {};
  content = content || {};
  return new Message(parentMessage.identities, header, parentMessage.header, metadata, content);
}

function readMessage(socketData, signer) {
  var identities = socketData[0];
  var signature = socketData[2];
  var header = socketData[3];
  var parentHeader = socketData[4];
  var metadata = socketData[5];
  var content = socketData[6];

  if (!signer.validate(signature, [ header, parentHeader, metadata, content ])) {
    return null;
  }

  return new Message(identities,
                     JSON.parse(header),
                     JSON.parse(parentHeader),
                     JSON.parse(metadata),
                     JSON.parse(content));
}

Message.prototype.write = function(socket, signer) {
  var header = JSON.stringify(this.header);
  var parentHeader = JSON.stringify(this.parentHeader);
  var metadata = JSON.stringify(this.metadata);
  var content = JSON.stringify(this.content);

  var signature = signer.sign([ header, parentHeader, metadata, content ]);

  var socketData = [
    this.identities,
    DELIMITER,
    signature,
    header,
    parentHeader,
    metadata,
    content
  ];
  socket.send(socketData);
}

module.exports = {
  create: createMessage,
  read: readMessage
};
