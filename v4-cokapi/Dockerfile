# to build:
# docker build -t="pgbovine/cokapi:v1" .
#
# to test:
# docker run -t -i --rm pgbovine/cokapi:v1 bash
#
# remember --rm or else stale old containers will be left around!
# use "docker ps -a" to see all containers
FROM ubuntu:latest
MAINTAINER Philip Guo <philip@pgbovine.net>
RUN apt-get update && apt-get install -y \
  nodejs \
  python
RUN ln -s /usr/bin/nodejs /usr/bin/node

RUN mkdir /tmp/javascript
RUN mkdir /tmp/python

# IMPORTANT: make sure to run 'make deps' in backends/javascript first
# to install the proper node modules inside of here via npm before
# creating this Docker container, since it's a pain to install npm and
# modules within the container
ADD backends/javascript /tmp/javascript
ADD backends/python /tmp/python
