var tern = require('tern');
var ecma5 = require('../../node_modules/tern/defs/ecma5.json');
var nodePlugin = require('../../node_modules/tern/plugin/node.js');
var requirePlugin = require('../../node_modules/tern/plugin/requirejs.js');

var context = {
  "!name": "repl",
  "x": "string"
}

var ternOptions = {
  defs: [ecma5, context],
  plugins: {
    node: {},
    requirejs: {}
  }
};
var ternServer = new tern.Server(ternOptions);

function ternCallback(error, response) {
  if (error) {
    console.log('error:');
    console.dir(error);
  }
  else {
    console.dir(response);
  }
}

function run(code) {
  console.log('----');
  console.log(code);

  var query = { type: 'completions', file: 'code', end: code.length };
  var file = { type: 'full', name: 'code', text: code };

  ternServer.request({ query: query, files: [file] }, ternCallback);
}

run('x.');
run('fs = require("fs"); fs.');
run('fs = req');
run('fs = require("fs"); y = 123; y.');
run('str = "aaa"; s');
run('function greeting() { return "Hello"; } greeting().');
