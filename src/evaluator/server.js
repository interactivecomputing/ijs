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
// server.js
// Implements a web server associated with the shell that can be used to make content and
// code within the shell accessible over HTTP.
//

var express = require('express'),
    http = require('http'),
    util = require('util');


function Server() {
  this._port = 0;
  this._server = null;
  this._app = null;
  this._content = {};
}

Server.prototype.port = function() {
  return this._port;
}

Server.prototype.running = function() {
  return this._server != null;
}

Server.prototype.start = function(port) {
  if (this._server) {
    if (this._port == port) {
      return;
    }

    throw new Error('Server is already running on a different port');
  }

  var app = express();
  app.get('/static/:id', this._staticContentHandler.bind(this));

  var server = http.createServer(app);
  server.listen(port, '127.0.0.1');

  this._app = app;
  this._server = server;
  this._port = port;
}

Server.prototype.stop = function() {
  if (this._server) {
    this._app = null;
    this._port = 0;

    var server = this._server;
    this._server = null;

    server.close();
  }
}

Server.prototype.addContent = function(id, data, mime) {
  this._content[id] = {
    data: data,
    mime: mime
  }

  return util.format('http://localhost:%d/static/%s', this._port, id);
}

Server.prototype.removeContent = function(id) {
  delete this._content[id];
}

Server.prototype._staticContentHandler = function(request, response) {
  var content = this._content[request.params.id];
  if (!content) {
    response.status(404).end();
    return;
  }

  response.type(content.mime);

  if (content.mime == 'application/json') {
    response.json(content.data);
  }
  else {
    response.send(content.data);
  }

  response.end();
}

module.exports = new Server();
