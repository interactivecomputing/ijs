// index.js
//

var fs = require('fs'),
    parser = require('nomnom');

var Session = require('./protocol/session'),
    Shell = require('./evaluator/shell');

function main() {
  parser.script('ijs')
        .nocolors()
        .printer(function(s, code) {
          console.log(s);
          if (code) {
            console.log(parser.getUsage());
            process.exit(code);
          }
        })
        .option('version', {
          abbr: 'v',
          flag: true,
          help: 'print version and exit',
          callback: function() {
            console.log('0.1.0');
            process.exit(0);
          }
        })
        .option('modulesPath', {
          abbr: 'm',
          full: 'modules',
          metavar: 'path',
          type: 'string',
          required: true,
          help: 'path that will contain installed node modules',
          callback: function(modulesPath) {
            if (!fs.existsSync(modulesPath) || !fs.statSync(modulesPath).isDirectory()) {
              return 'expected an existing directory for modules path';
            }
            return null;
          }
        })
        .option('connectionFile', {
          position: 0,
          required: true,
          help: 'path to file containing kernel connection information'
        });
  var options = parser.parse(process.argv.slice(2));

  if (options) {
    var shellConfig = {
      modulesPath: options.modulesPath
    };

    var connectionConfig = JSON.parse(fs.readFileSync(options.connectionFile,
                                                      { encoding: 'utf8' }));

    var shell = Shell.create(shellConfig);
    Session.run(shell, connectionConfig);
  }
}

main();
