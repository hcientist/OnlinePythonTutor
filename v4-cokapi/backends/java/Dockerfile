# Java visualizer backend using Oracle's Java 8

# to build:
# docker build -t="pgbovine/cokapi-java:v1" .
#
# to test:
# docker run -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-java:v1 bash
#
# remember --rm or else stale old containers will be left around!
# use "docker ps -a" to see all containers

# need to use at least 16.04 to get Java 8
FROM ubuntu:16.04
MAINTAINER Philip Guo <philip@pgbovine.net>

# if apt-get doesn't work, then follow these instructions:
# http://stackoverflow.com/questions/24991136/docker-build-could-not-resolve-archive-ubuntu-com-apt-get-fails-to-install-a
# Uncomment the following line in /etc/default/docker DOCKER_OPTS="--dns 8.8.8.8 --dns 8.8.4.4"
# Restart the Docker service sudo service docker restart

# March 2018: use the pre-packed version of the JDK in this directory instead
# of trying to download from a repo, since Dave Pritchard originally made the
# visualizer to work with this specific version circa 2013!
# (why didn't i include a tar/zip file? because it's too big to fit into
# GitHub's free accounts with a 100MB limit, so i had to unzip it before
# putting it in my repo!)
ADD jdk1.8.0_20/ /tmp/jdk1.8.0_20

RUN mkdir /tmp/java_jail
RUN mkdir /tmp/java_jail/cp
ADD java_jail/cp/ /tmp/java_jail/cp

# compile all Java files within cp/
RUN cd /tmp/java_jail/cp && find . -name "*.java" -print | xargs /tmp/jdk1.8.0_20/bin/javac -Xlint:unchecked -cp .:javax.json-1.0.jar:/tmp/jdk1.8.0_20/lib/tools.jar

COPY run-java-backend.sh /tmp/
RUN chmod a+x /tmp/run-java-backend.sh

RUN useradd netuser
