#!/bin/sh

# $1 is a string representing a JSON object that the Java backend
# expects as input, such as: java_jail/cp/traceprinter/test-input.txt

# this will be run within Docker
echo $1 | java -cp /tmp/java_jail/cp:/tmp/java_jail/cp/javax.json-1.0.jar:/usr/lib/jvm/java-7-openjdk-amd64/lib/tools.jar traceprinter.InMemory

#echo '{ "usercode": "public class Test { public static void main(String[] args) { int x = 3; x += x; } }", "options": {}, "args": [], "stdin": "" }' | java -cp /tmp/java_jail/cp:/tmp/java_jail/cp/javax.json-1.0.jar:/usr/lib/jvm/java-7-openjdk-amd64/lib/tools.jar traceprinter.InMemory
