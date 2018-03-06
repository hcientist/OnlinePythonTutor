#!/bin/sh

# run this from within a Docker container

# $1 is a string representing a JSON object that the Java backend
# expects as input, such as: java_jail/cp/traceprinter/test-input.txt

# tricky! use a heredoc to pipe the $1 argument into the stdin of the
# java executable WITHOUT interpreting escape chars such as '\n' ...
# echo doesn't work here since it interprets '\n' and other chars
#
# TODO: try different -Xmx512m memory settings depending on user needs
cat <<ENDEND | /tmp/jdk1.8.0_20/bin/java -Xmx512m -cp /tmp/java_jail/cp:/tmp/java_jail/cp/javax.json-1.0.jar:/tmp/jdk1.8.0_20/lib/tools.jar:/tmp/java_jail/cp/visualizer-stdlib traceprinter.InMemory
$1
ENDEND
