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
// display.js
// Implements conversion of values resulting from evaluations into display data for rendering
// within a notebook.
//

var util = require('util');

// Generates display data, an object with key/value pairs, where each key is a mime type.
// Unless the value is null/undefined, a plain text representation is always produced if no other
// specific representation can be generated.
function createDisplayData(value) {
  var displayData = {};

  if ((value === null) || (value === undefined)) {
    return displayData;
  }

  var useFallbacks = true;

  if (typeof value.toHTML == 'function') {
    displayData['text/html'] = value.toHTML();
    useFallbacks = false;
  }

  if (typeof value.toScript == 'function') {
    displayData['application/javascript'] = value.toScript();
    useFallbacks = false;
  }

  if (typeof value.toImage == 'function') {
    var buffer = value.toImage();
    if (buffer) {
      var data = buffer.toString('base64');
      var mime = buffer.mime || 'image/png';
      var text = buffer.text;

      displayData[mime] = data;
      if (text) {
        displayData['text/plain'] = text;
      }

      useFallbacks = false;
    }
  }

  if (useFallbacks) {
    if ((value.constructor == Object) ||
        (value.constructor == Array)) {
      displayData['application/json'] = value;
    }
    else {
      displayData['text/plain'] = value.toString();
    }
  }

  return displayData;
}


module.exports = {
  data: createDisplayData
};
