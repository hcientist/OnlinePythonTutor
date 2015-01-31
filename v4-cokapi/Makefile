all:
	jshint cokapi.js && node cokapi.js

deps:
	npm install express jshint serve-static sqlite3

docker:
	docker build -t="pgbovine/cokapi:v1" .

test:
	@echo 'Python'
	@time --portability docker run --rm pgbovine/cokapi:v1 python /tmp/python/generate_json_trace.py --code="x=1; y=2; z=x+y"
	@echo
	@echo 'JS'
	@time --portability docker run --rm pgbovine/cokapi:v1 node --expose-debug-as=Debug /tmp/javascript/jslogger.js --jsondump=true --code="var x=1; var y=2; var z=x+y;"
	@echo
	@echo 'Java'
	@time --portability docker run -i --rm pgbovine/cokapi:v1 java -cp /tmp/java_jail/cp:/tmp/java_jail/cp/javax.json-1.0.jar:/usr/lib/jvm/java-7-openjdk-amd64/lib/tools.jar traceprinter.InMemory < backends/java/java_jail/cp/traceprinter/test-input.txt
