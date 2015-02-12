#!/bin/sh

mkdir -p /tmp/notebooks
mkdir -p /tmp/static
mkdir -p /tmp/modules

BASEDIR=$(cd "$(dirname "$0")/.."; pwd)

ipython notebook \
  --KernelManager.kernel_cmd="['node', '$BASEDIR/src/index.js', '-m', '/tmp/modules', '{connection_file}']" \
  --NotebookApp.extra_static_paths="['./bin', '/tmp/static']" \
  --notebook-dir=/tmp/notebooks \
  --ip="*" --port=9999 \
  --matplotlib=inline --no-mathjax --no-script --quiet

