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

var code = 'fs = require("fs"); y.';
var query = { type: 'completions', file: 'test', end: code.length };
var files = [ { type: "full", name: "test", text: code }, { type: "full", name: "t", text: 'y = 123;' } ];

ternServer.request({ query: query, files: files }, function(error, response) {
  console.log('error:');
  console.dir(error);

  console.log('response:');
  console.dir(response);
});
