// modules.js
//

var npm = require('npm'),
    q = require('q');

function moduleCommand(shell, args, data, evaluationId) {
  var deferred = q.defer();


  npm.commands.install(shell.config.modulesPath, [ args.name ], function(error) {
    if (error) {
      deferred.reject(error);
    }
    else {
      shell.installedModules[args.name] = true;
      deferred.resolve();
    }
  });
  return deferred.promise;
}
moduleCommand.options = function(parser) {
  return parser
    .help('Installs the specified module and makes it available for use')
    .option('name', {
      position: 0,
      required: true,
      help: 'the name of the module to install'
    });
}

function modulesCommand(shell, args, data, evaluationId) {
  var names = [];
  for (var n in shell.installedModules) {
    names.push(n);
  }

  console.log(names.join('\n'));
}
modulesCommand.options = function(parser) {
  return parser.help('Lists the set of installed modules.');
}


function initialize(shell) {
  shell.registerCommand('module', moduleCommand);
  shell.registerCommand('modules', modulesCommand);
}

module.exports = {
  initialize: initialize
};
