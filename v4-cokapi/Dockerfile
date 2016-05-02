# to build:
# docker build -t="pgbovine/cokapi:v1" .
#
# to test:
# docker run -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi:v1 bash
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
#
# lots of packages required especially to build ruby and to use the compiled version of 'gem'
RUN apt-get update && apt-get install -y \
  nodejs \
  openjdk-7-jdk \
  python \
  build-essential \
  zlibc \
  zlib1g \
  zlib1g-dev \
  libssl-dev


# ugh ubuntu calls node 'nodejs'
RUN ln -s /usr/bin/nodejs /usr/bin/node


# Ruby backend: pretty complex setup since we need to compile and
# install a custom Ruby interpreter
#
# run all of this stuff early so that we don't invalidate the cache
RUN mkdir /tmp/ruby
# automatically untars
ADD backends/ruby/custom-ruby-interpreter/ruby-2.2.2.tar.gz /tmp/ruby
ADD backends/ruby/custom-ruby-interpreter/altered-files /tmp/ruby/ruby-2.2.2
RUN mkdir /tmp/ruby/ruby-2.2.2-custom-OPT/
RUN cd /tmp/ruby/ruby-2.2.2 && ./configure --prefix=/tmp/ruby/ruby-2.2.2-custom-OPT/
# beware takes a long time! so make sure we cache the build
RUN cd /tmp/ruby/ruby-2.2.2 && make && make install
# install custom gem
RUN /tmp/ruby/ruby-2.2.2-custom-OPT/bin/gem install debug_inspector


# Java backend (put early in Dockerfile since it doesn't change as
# frequently and takes longer to build)
RUN mkdir /tmp/java_jail
RUN mkdir /tmp/java_jail/cp
ADD backends/java/java_jail/cp/ /tmp/java_jail/cp

# compile all Java files within cp/
RUN cd /tmp/java_jail/cp && find . -name "*.java" -print | xargs javac -cp .:javax.json-1.0.jar:/usr/lib/jvm/java-7-openjdk-amd64/lib/tools.jar

# JS and Python backends
RUN mkdir /tmp/javascript
RUN mkdir /tmp/python

# IMPORTANT: make sure to run 'make deps' in backends/javascript first
# to install the proper node modules inside of here via npm before
# creating this Docker container, since it's a pain to install npm and
# modules within the container. Also untar node-v6.0.0-linux-x64.tar.xz
# (or the proper version of Node so that the proper binary is within the
# directory already before copying into container)
ADD backends/javascript /tmp/javascript
ADD backends/python /tmp/python

COPY backends/java/run-java-backend.sh /tmp/
RUN chmod a+x /tmp/run-java-backend.sh


# Ruby backend
COPY backends/ruby/pg_logger.rb /tmp/ruby/
RUN cd /tmp/ruby && ln -s ruby-2.2.2-custom-OPT/bin/ruby

# To properly run Ruby tests, become root:
# $ docker run -t -i --rm --net=none --cap-drop all pgbovine/cokapi:v1 bash
#COPY backends/ruby/golden_test.py /tmp/ruby/
#RUN mkdir /tmp/ruby/tests
#ADD backends/ruby/tests /tmp/ruby/tests

RUN useradd netuser
