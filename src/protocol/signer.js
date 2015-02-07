// signer.js
//

var crypto = require('crypto');

function computeSignature(values, signatureScheme, signatureKey) {
  var hmac = crypto.createHmac(signatureScheme, signatureKey);
  values.forEach(function(v) {
    hmac.update(v);
  });

  return hmac.digest('hex');
}

function createSigner(signatureScheme, signatureKey) {
  if (signatureKey) {
    // Create a SHA256-based signer that generates and validates signatures
    signatureScheme = signatureScheme || 'sha256';
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
