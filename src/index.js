// index.js
//

var Session = require('./protocol/session'),
    Shell = require('./evaluator/shell');

function main() {
  var shell = Shell.create();
  Session.run(shell, process.argv[2]);
}

main();
