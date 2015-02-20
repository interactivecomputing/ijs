// commands.js
//

function htmlCommand(shell, args, data, evaluationId) {
  return {
    toHTML: function() {
      return data;
    }
  };
}
htmlCommand.options = function(parser) {
  return parser.help('Creates and renders HTML markup.');
}


function textCommand(shell, args, data, evaluationId) {
  shell.context[args.name] = data;
}
textCommand.options = function(parser) {
  return parser
    .help('Creates a string variable from the specified text.')
    .option('name', {
      abbr: 'n',
      full: 'name',
      metavar: 'variable',
      type: 'string',
      required: true,
      help: 'the variable that will be assigned'
    });
}


function jsonCommand(shell, args, data, evaluationId) {
  shell.context[args.name] = JSON.parse(data);
}
jsonCommand.options = function(parser) {
  return parser
    .help('Creates an object from the specified JSON text.')
    .option('name', {
      abbr: 'n',
      full: 'name',
      metavar: 'variable',
      type: 'string',
      required: true,
      help: 'the variable that will be assigned'
    });
}


function initialize(shell) {
  shell.registerCommand('html', htmlCommand);
  shell.registerCommand('text', textCommand);
  shell.registerCommand('json', jsonCommand);
}

module.exports = {
  initialize: initialize
};
