// shell.js
//

var vm = require('vm');

var _config;
var _state = {
  console: console
};
var _context = vm.createContext(_state);

function evaluate(code, evaluationId) {
  return vm.runInContext(code, _context, 'code');
}

function createShell(config) {
  _config = config;
  return {
    evaluate: evaluate
  };
}

module.exports = {
  create: createShell
};
