// index.js
//

var parser = require('nomnom');

var Session = require('./protocol/session'),
    Shell = require('./evaluator/shell');

function main() {
  parser.script('ijs')
        .nocolors()
        .printer(function(s) { console.log(s); })
        .option('version', {
          abbr: 'v',
          flag: true,
          help: 'print version and exit',
          callback: function() {
            console.log('0.1.0');
            process.exit(0);
          }
        })
        .option('connectionFile', {
          position: 0,
          required: true,
          help: 'path to file containing kernel connection information'
        });
  var options = parser.parse(process.argv.slice(2));

  if (options) {
    var shell = Shell.create();
    Session.run(shell, options.connectionFile);
  }
}

main();
