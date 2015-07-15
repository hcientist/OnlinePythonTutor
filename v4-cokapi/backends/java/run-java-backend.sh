#!/bin/sh

# $1 is a string representing a JSON object that the Java backend
# expects as input, such as: java_jail/cp/traceprinter/test-input.txt

# this will be run within Docker

# tricky! use a heredoc to pipe the $1 argument into the stdin of the
# java executable WITHOUT interpreting escape chars such as '\n' ...
# echo doesn't work here since it interprets '\n' and other chars
#
# TODO: use -Xmx512m if we need more memory
cat <<ENDEND | java -Xmx384m -cp /tmp/java_jail/cp:/tmp/java_jail/cp/javax.json-1.0.jar:/usr/lib/jvm/java-7-openjdk-amd64/lib/tools.jar:/tmp/java_jail/cp/visualizer-stdlib traceprinter.InMemory
$1
ENDEND
