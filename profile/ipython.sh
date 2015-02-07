#!/bin/sh

mkdir -p /tmp/notebooks

ipython notebook --config=config.py --notebook-dir=/tmp/notebooks \
  --ip="*" --port=9999 \
  --matplotlib=inline --no-mathjax --no-script --quiet

