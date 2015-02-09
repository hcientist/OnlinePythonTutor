# to build:
# docker build -t="pgbovine/cokapi:v1" .
#
# to test:
# docker run -t -i --rm pgbovine/cokapi:v1 bash
#
# remember --rm or else stale old containers will be left around!
# use "docker ps -a" to see all containers

# don't use 'latest' tag since that might change
FROM ubuntu:14.04.1
MAINTAINER Philip Guo <philip@pgbovine.net>
RUN apt-get update && apt-get install -y \
  nodejs \
  openjdk-7-jdk \
  python

# ugh ubuntu calls node 'nodejs'
RUN ln -s /usr/bin/nodejs /usr/bin/node


# Java backend (put first in Dockerfile since it doesn't change as
# frequently and takes longer to build)
RUN mkdir /tmp/java_jail
RUN mkdir /tmp/java_jail/cp
ADD backends/java/java_jail/cp/ /tmp/java_jail/cp

# compile all Java files within cp/
RUN cd /tmp/java_jail/cp && find . -name "*.java" -print | xargs javac -Xlint:unchecked -cp .:javax.json-1.0.jar:/usr/lib/jvm/java-7-openjdk-amd64/lib/tools.jar

# JS and Python backends
RUN mkdir /tmp/javascript
RUN mkdir /tmp/python

# IMPORTANT: make sure to run 'make deps' in backends/javascript first
# to install the proper node modules inside of here via npm before
# creating this Docker container, since it's a pain to install npm and
# modules within the container
ADD backends/javascript /tmp/javascript
ADD backends/python /tmp/python

COPY backends/java/run-java-backend.sh /tmp/
RUN chmod a+x /tmp/run-java-backend.sh
