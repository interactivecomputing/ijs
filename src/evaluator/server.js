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

var http = require('http');


function Server() {
  this._port = 0;
  this._server = null;
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

  var server = http.createServer(this._handleRequest.bind(this));
  server.listen(port, '127.0.0.1');

  this._server = server;
  this._port = port;
}

Server.prototype.stop = function() {
  if (this._server) {
    var server = this._server;
    this._server = null;

    server.close();
  }
}

Server.prototype._handleRequest = function(request, response) {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('IJavaScript Server - Hello World!');
}

module.exports = new Server();
