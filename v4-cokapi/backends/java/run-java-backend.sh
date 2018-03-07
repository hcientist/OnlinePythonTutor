#!/bin/sh

# run this from within a Docker container

# $1 is a string representing a JSON object that the Java backend
# expects as input, such as: java_jail/cp/traceprinter/test-input.txt

# tricky! use a heredoc to pipe the $1 argument into the stdin of the
# java executable WITHOUT interpreting escape chars such as '\n' ...
# echo doesn't work here since it interprets '\n' and other chars

# old memory value: -Xmx512m (or was it -Xmx512M ?)
#
# OK, my current folk hypothesis is that this InMemory process should
# *not* be given a lot of RAM, since that will simply eat up the limited
# RAM quota in the docker container available to the child process
# that it launches!
cat <<ENDEND | /tmp/jdk1.8.0_20/bin/java -cp /tmp/java_jail/cp:/tmp/java_jail/cp/javax.json-1.0.jar:/tmp/jdk1.8.0_20/lib/tools.jar:/tmp/java_jail/cp/visualizer-stdlib traceprinter.InMemory
$1
ENDEND
