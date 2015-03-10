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

function run(code, moreCode) {
  console.log('----');
  console.log(code);

  var query = { type: 'completions', file: 'code', end: code.length };
  var files = [];

  files.push({ type: 'full', name: 'code', text: code });
  if (moreCode) {
    files.push({ type: 'full', name: 'moreCode', text: moreCode });
  }

  ternServer.request({ query: query, files: files }, ternCallback);
}

//run('fs = require("fs"); fs.');
//run('fs = req');
//run('fs = require("fs"); y.', 'y = 123;');
//run('s', 'str = "aaa";');

function run2(code, moreCode) {
  console.log('----');
  console.log(code);

  ternServer.request({files: [{type: 'full', name: 'moreCode', text: moreCode}]}, ternCallback);
  ternServer.request({files: [{type: 'full', name: 'code', text: code}]}, ternCallback);
  // ternServer.addFile('moreCode', moreCode);
  // ternServer.addFile('code', code);

  var query = { type: 'completions', file: 'code', end: code.length };
  ternServer.request({ query: query }, ternCallback);
}

run2('greeting().', 'function greeting() { return "Hello"; }');
