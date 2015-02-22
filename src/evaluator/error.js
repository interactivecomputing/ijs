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
// error.js
// A helper to create errors raised by the shell.
//

var util = require('util');

// Create Error objects with their trace suppressed. This is useful for generating error
// message responses within the shell.
function createError() {
  var e = new Error(util.format.apply(null, arguments));
  e.trace = false;

  return e;
}


module.exports = {
  create: createError
};
