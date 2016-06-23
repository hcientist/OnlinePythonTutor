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

# Follow these instructions for installing Oracle's official Java 8
# http://www.webupd8.org/2012/09/install-oracle-java-8-in-ubuntu-via-ppa.html
RUN apt-get update && apt-get install -y software-properties-common
RUN apt-add-repository ppa:webupd8team/java
RUN apt-get update
RUN yes | apt-get install -y oracle-java8-installer # pipe 'y' using 'yes' to agree to Oracle's terms of service for installer

RUN mkdir /tmp/java_jail
RUN mkdir /tmp/java_jail/cp
ADD java_jail/cp/ /tmp/java_jail/cp

# compile all Java files within cp/
RUN cd /tmp/java_jail/cp && find . -name "*.java" -print | xargs javac -Xlint:unchecked -cp .:javax.json-1.0.jar:/usr/lib/jvm/java-8-oracle/lib/tools.jar

COPY run-java-backend.sh /tmp/
RUN chmod a+x /tmp/run-java-backend.sh

RUN useradd netuser
