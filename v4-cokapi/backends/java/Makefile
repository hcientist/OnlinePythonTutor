# build a docker container
all:
	docker build -t="pgbovine/cokapi-java:v1" .

# test running the Java backend in the docker container on a simple test input JSON passed as a command-line arg:
test:
	docker run -m 512M --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-java:v1 /tmp/run-java-backend.sh '{"usercode": "public class Test { public static void main(String[] args) { int x=42; x+=1; x+=1; x+=1;} }", "options": {}, "args": [], "stdin": ""}'

bash:
	docker run -m 512M -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-java:v1 bash


local:
	cd java_jail/cp && make
