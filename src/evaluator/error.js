// error.js
//

var util = require('util');

function createError() {
  var e = new Error(util.format.apply(null, arguments));
  e.trace = false;

  return e;
}

module.exports = {
  create: createError
};
