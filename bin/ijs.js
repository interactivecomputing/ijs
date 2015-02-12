#!/usr/bin/env node

// ijs.js
//

var childProcess = require('child_process'),
    fs = require('fs'),
    path = require('path');

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

var modulesPath = path.join(userPath, 'modules');
if (!fs.existsSync(modulesPath)) {
  fs.mkdirSync(modulesPath);
}

var kernelPath = path.join(__dirname, '..', 'src', 'index.js');
var kernelArgs = [
  'node',
  kernelPath,
  '--modules', modulesPath,
  '{connection_file}'
].map(function(arg) { return '"' + arg + '"'; }).join(',');

var staticPaths = [
  __dirname,
  contentPath
].map(function(p) { return '"' + p + '"' }).join(',')

var args = [
  'notebook',
  '--KernelManager.kernel_cmd=[' + kernelArgs + ']',
  '--NotebookApp.extra_static_paths=[' + staticPaths + ']',
  '--notebook-dir=' + notebooksPath,
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
