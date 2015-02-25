#!/bin/sh

# Sleep to wait for the mounted volume to become available in the container
sleep 5

# Run ijs with the /data volume as the directory containing notebooks etc.
ijs /data

