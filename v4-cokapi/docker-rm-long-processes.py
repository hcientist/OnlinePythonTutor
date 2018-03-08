#!/usr/bin/env python

# remove all docker processes that have the word 'minute' or 'hour'
# associated with them when you run 'docker ps -a' to list all processes
import os, subprocess
p = subprocess.Popen(['docker', 'ps', '-a'], stdout=subprocess.PIPE)

ids_to_remove = []

for line in p.stdout.readlines():
    # skip header line
    if line.startswith('CONTAINER'):
        continue
    # if something is running for a long time, then KILL IT
    if 'minute' in line or 'hour' in line:
        print line,
        container_id = line.split()[0]
        ids_to_remove.append(container_id)

if ids_to_remove:
    p = subprocess.Popen(['docker', 'rm', '-f'] + ids_to_remove)
    p.communicate()
