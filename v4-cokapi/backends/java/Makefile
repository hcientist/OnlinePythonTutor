all:
	cd java_jail/cp && find . -name "*.java" -print | xargs javac -cp .:javax.json-1.0.jar:/usr/lib/jvm/java-7-openjdk-amd64/lib/tools.jar

test:
	java -Xmx128M -cp java_jail/cp:java_jail/cp/javax.json-1.0.jar:/usr/lib/jvm/java-7-openjdk-amd64/lib/tools.jar:java_jail/cp/visualizer-stdlib traceprinter.InMemory < java_jail/cp/traceprinter/test-input.txt

bigtest:
	java -Xmx128M -cp java_jail/cp:java_jail/cp/javax.json-1.0.jar:/usr/lib/jvm/java-7-openjdk-amd64/lib/tools.jar:java_jail/cp/visualizer-stdlib traceprinter.InMemory < big-input.txt 
