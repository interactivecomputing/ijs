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

function Server() {
  this._port = 0;
}

Server.prototype.running = function() {
  // TOOD: Implement this
}

Server.prototype.start = function(port) {
  // TODO: Implement this
}

Server.prototype.stop = function() {
  // TODO: Implement this
}


module.exports = new Server();
