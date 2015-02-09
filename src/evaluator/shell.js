// shell.js
//

var vm = require('vm');

var state = {
  console: console
};
var context = vm.createContext(state);

function evaluate(code, evaluationId) {
  return vm.runInContext(code, context, 'code');
}

function createShell() {
  return {
    evaluate: evaluate
  };
}

module.exports = {
  create: createShell
};
