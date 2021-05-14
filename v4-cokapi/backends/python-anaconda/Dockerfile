# an alternative Python visualizer backend using the Anaconda distribution
# of Python 3.6, which includes *tons* of third-party libraries
# (note that the regular Python backend lives in ../../../v5-unity/
#  and does not require Docker. that one is faster and more streamlined,
#  but doesn't have tons of third-party libraries.)
#
# i based this image on the official Anaconda docker image:
# https://github.com/ContinuumIO/docker-images/tree/master/anaconda3
#
# to install additional packages, run 'pip install altair' to install packages
# like altair, or use conda install as well

# to build:
# docker build -t="pgbovine/cokapi-python-anaconda:v1" .
#
# to test:
# docker run -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-python-anaconda:v1 bash
#
# remember --rm or else stale old containers will be left around!
# use "docker ps -a" to see all containers

# this dockerfile is loosely based on:
# https://github.com/ContinuumIO/docker-images/blob/master/anaconda3/Dockerfile

# another way to get this docker image, run: docker pull continuumio/anaconda3
# instructions: https://github.com/ContinuumIO/docker-images/tree/master/anaconda3
FROM continuumio/anaconda3

MAINTAINER Philip Guo <philip@pgbovine.net>

RUN useradd netuser
RUN mkdir /tmp/python

# note that we need to run copy-v5-python-files.sh *first* to copy the
# latest versions of the appropriate python files into this directory
ADD generate_json_trace.py /tmp/python
ADD pg_encoder.py /tmp/python
ADD pg_logger.py /tmp/python
