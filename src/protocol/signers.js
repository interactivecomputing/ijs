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
// signers.js
// Provides messaging signer implementations as needed for the kernel protocol.
//

var crypto = require('crypto');

// A helper function to compute a signature using an hmac object.
function computeSignature(values, signatureScheme, signatureKey) {
  var hmac = crypto.createHmac(signatureScheme, signatureKey);
  values.forEach(function(v) {
    hmac.update(v);
  });

  return hmac.digest('hex');
}

// Creates a signer given the specified schema and key.
function createSigner(signatureScheme, signatureKey) {
  if (signatureKey) {
    // Create a SHA256-based signer that generates and validates signatures
    signatureScheme = signatureScheme || 'sha256';
    if (signatureScheme.indexOf('hmac-') === 0) {
      signatureScheme = signatureScheme.substr(5);
    }
    return {
      sign: function(values) {
        return computeSignature(values, signatureScheme, signatureKey);
      },
      validate: function(signature, values) {
        return signature === computeSignature(values, signatureScheme, signatureKey);
      }
    }
  }
  else {
    // Create a no-op signer
    return {
      sign: function() { return ''; },
      validate: function() { return true; }
    }
  }
}


module.exports = {
  create: createSigner
};
