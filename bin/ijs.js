#!/usr/bin/env node

// ijs.js
//

var childProcess = require('child_process'),
    fs = require('fs'),
    path = require('path');

var kernelPath = path.join(__dirname, '..', 'src', 'index.js');
var staticPath = __dirname;

var userPath = process.argv[2];
if (!userPath || !fs.existsSync(userPath) || !fs.statSync(userPath).isDirectory()) {
  console.error('Usage: ijs <directory>');
  process.exit(1);
}

var notebooksPath = path.join(userPath, 'notebooks');
if (!fs.existsSync(notebooksPath)) {
  fs.mkdirSync(notebooksPath);
}

var contentPath = path.join(userPath, 'static');
if (!fs.existsSync(contentPath)) {
  fs.mkdirSync(contentPath);
}


var args = [
  'notebook',
  '--KernelManager.kernel_cmd=["node", "' + kernelPath + '", "{connection_file}"]',
  '--NotebookApp.extra_static_paths=["' + staticPath + '", "' + contentPath + '"]',
  '--notebook-dir', notebooksPath,
  '--ip="*"',
  '--port=9999',
  '--matplotlib=inline',
  '--no-mathjax',
  '--no-script',
  '--quiet'
];
var options = {
  stdio: 'inherit'
};

var ipython = childProcess.spawn('ipython', args, options);
process.on('SIGINT', function() {
  ipython.emit('SIGINT');
});
