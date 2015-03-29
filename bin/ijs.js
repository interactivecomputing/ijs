#!/usr/bin/env node

// Copyright 2015 Interactive Computing project (https://github.com/interactivecomputing).
// All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
// except in compliance with the License. You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software distributed under the
// License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
// either express or implied. See the License for the specific language governing permissions
// and limitations under the License.
//
// ijs.js
// Launching script installed as executable via npm
//

var childProcess = require('child_process'),
    fs = require('fs'),
    path = require('path');

var userPath = process.argv[2];
if (userPath) {
  userPath = path.join(process.cwd(), userPath);
}
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

var modulesPath = path.join(userPath, 'lib');
if (!fs.existsSync(modulesPath)) {
  fs.mkdirSync(modulesPath);
}

var extensionsPath = path.join(userPath, 'ext');
if (!fs.existsSync(extensionsPath)) {
  fs.mkdirSync(extensionsPath);
}

var executable = process.argv[3] == 'debug' ? 'node-debug' : 'node';
var kernelPath = path.join(__dirname, '..', 'src', 'index.js');
var kernelArgs = [
  executable,
  kernelPath,
  '--modules', modulesPath,
  '--extensions', extensionsPath,
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
  '--Session.key=""',
  '--Session.keyfile=""',
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
