// modules.js
//

var npm = require('npm'),
    q = require('q');

function moduleCommand(shell, args, data, evaluationId) {
  var deferred = q.defer();

  var names = [args[0]];
  npm.commands.install(shell.config.modulesPath, names, function(error) {
    if (error) {
      deferred.reject(error);
    }
    else {
      shell.installedModules[args[0]] = true;
      deferred.resolve();
    }
  });
  return deferred.promise;
}
moduleCommand.options = function(parser) {
  return parser.option('name', {
    position: 0,
    required: true,
    help: 'name of the module to install'
  });
}

function modulesCommand(shell, args, data, evaluationId) {
  var names = [];
  for (var n in shell.installedModules) {
    names.push(n);
  }

  console.log(names);
}
moduleCommand.options = function(parser) {
  return parser;
}


function initialize(shell) {
  shell.registerCommand('module', moduleCommand);
  shell.registerCommand('modules', modulesCommand);
}

module.exports = {
  initialize: initialize
};
