#!/bin/sh

if [ "$1" = "" ]; then
  DATA_DIR=$PWD
else
  DATA_DIR=$1
fi

docker run -i -p 9999:9999 -v $DATA_DIR:/data -t nikhilk/ijs

