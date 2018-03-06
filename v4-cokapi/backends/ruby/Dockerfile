# Ruby visualizer backend using a custom-compiled version of Ruby (MRI) 2.2

# to build:
# docker build -t="pgbovine/cokapi-ruby:v1" .
#
# to test:
# docker run -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-ruby:v1 bash
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
  python \
  build-essential \
  zlibc \
  zlib1g \
  zlib1g-dev \
  libssl-dev


# Ruby backend: pretty complex setup since we need to compile and
# install a custom Ruby interpreter
#
# run all of this stuff early so that we don't invalidate the cache
RUN mkdir /tmp/ruby
# automatically untars
ADD custom-ruby-interpreter/ruby-2.2.2.tar.gz /tmp/ruby
ADD custom-ruby-interpreter/altered-files /tmp/ruby/ruby-2.2.2
RUN mkdir /tmp/ruby/ruby-2.2.2-custom-OPT/
RUN cd /tmp/ruby/ruby-2.2.2 && ./configure --prefix=/tmp/ruby/ruby-2.2.2-custom-OPT/
# beware takes a long time! so make sure we cache the build
RUN cd /tmp/ruby/ruby-2.2.2 && make && make install
# install custom gem
# specify a non-https source in .gemrc to avoid certificate problems
COPY .gemrc /root
RUN /tmp/ruby/ruby-2.2.2-custom-OPT/bin/gem install debug_inspector

COPY pg_logger.rb /tmp/ruby/
RUN cd /tmp/ruby && ln -s ruby-2.2.2-custom-OPT/bin/ruby

# To properly run Ruby tests, run as root since it needs to write files
COPY golden_test.py /tmp/ruby/
RUN mkdir /tmp/ruby/tests
ADD tests /tmp/ruby/tests

RUN useradd netuser
