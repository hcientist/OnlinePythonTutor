# to build:
# docker build -t="pgbovine/cokapi-java:v1" .
#
# to test:
# docker run -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-java:v1 bash
#
# remember --rm or else stale old containers will be left around!
# use "docker ps -a" to see all containers

# don't use 'latest' tag since that might change
FROM ubuntu:14.04.1
MAINTAINER Philip Guo <philip@pgbovine.net>

# if apt-get doesn't work, then follow these instructions:
# http://stackoverflow.com/questions/24991136/docker-build-could-not-resolve-archive-ubuntu-com-apt-get-fails-to-install-a
# Uncomment the following line in /etc/default/docker DOCKER_OPTS="--dns 8.8.8.8 --dns 8.8.4.4"
# Restart the Docker service sudo service docker restart
RUN apt-get update && apt-get install -y \
  openjdk-7-jdk

RUN mkdir /tmp/java_jail
RUN mkdir /tmp/java_jail/cp
ADD java_jail/cp/ /tmp/java_jail/cp

# compile all Java files within cp/
RUN cd /tmp/java_jail/cp && find . -name "*.java" -print | xargs javac -Xlint:unchecked -cp .:javax.json-1.0.jar:/usr/lib/jvm/java-7-openjdk-amd64/lib/tools.jar

COPY run-java-backend.sh /tmp/
RUN chmod a+x /tmp/run-java-backend.sh

RUN useradd netuser
