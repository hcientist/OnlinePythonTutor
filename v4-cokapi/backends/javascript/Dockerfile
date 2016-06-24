# JavaScript visualizer backend using Node.js

# to build:
# docker build -t="pgbovine/cokapi-js:v1" .
#
# to test:
# docker run -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-js:v1 bash
#
# remember --rm or else stale old containers will be left around!
# use "docker ps -a" to see all containers

# don't use 'latest' tag since that might change
FROM ubuntu:16.04
MAINTAINER Philip Guo <philip@pgbovine.net>

RUN useradd netuser

# if apt-get doesn't work, then follow these instructions:
# http://stackoverflow.com/questions/24991136/docker-build-could-not-resolve-archive-ubuntu-com-apt-get-fails-to-install-a
# Uncomment the following line in /etc/default/docker DOCKER_OPTS="--dns 8.8.8.8 --dns 8.8.4.4"
# Restart the Docker service sudo service docker restart
RUN apt-get update && apt-get install -y \
  python

RUN mkdir /tmp/javascript
ADD node-v6.0.0-linux-x64.tar.xz /tmp/javascript

# use this to tell npm what dependencies to install
ADD package.json /tmp/javascript

# - customize $PATH to run my version of npm
RUN cd /tmp/javascript/ && PATH=/tmp/javascript/node-v6.0.0-linux-x64/bin/:$PATH npm install

# add tests to container
ADD golden_test.py /tmp/javascript
RUN mkdir /tmp/javascript/tests/
ADD tests/ /tmp/javascript/tests/


# do this last so that even if this file changes, everything else
# earlier in this file doesn't need to be re-run
ADD jslogger.js /tmp/javascript
