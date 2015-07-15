all:
	jshint cokapi.js && node cokapi.js

# start both http and https servers
prod:
	jshint cokapi.js && forever -l cokapi.log start cokapi.js &
	jshint cokapi.js && forever -l cokapi-https.log start cokapi.js https &

deps:
	npm install express jshint serve-static sqlite3

docker:
	docker build -t="pgbovine/cokapi:v1" .

dockerbash:
	docker run -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi:v1 bash

test:
	@echo 'Python'
	@time --portability docker run --rm pgbovine/cokapi:v1 python /tmp/python/generate_json_trace.py --code="x=1; y=2; z=x+y"
	@echo
	@echo 'JS'
	@time --portability docker run --rm pgbovine/cokapi:v1 node --expose-debug-as=Debug /tmp/javascript/jslogger.js --jsondump=true --code="var x=1; var y=2; var z=x+y;"
	@echo
	@echo 'Java'
	@time --portability docker run -i --rm pgbovine/cokapi:v1 java -cp /tmp/java_jail/cp:/tmp/java_jail/cp/javax.json-1.0.jar:/usr/lib/jvm/java-7-openjdk-amd64/lib/tools.jar traceprinter.InMemory < backends/java/java_jail/cp/traceprinter/test-input.txt
	@echo
	@echo 'Ruby'
	@time --portability docker run -i --rm pgbovine/cokapi:v1 /tmp/ruby/ruby /tmp/ruby/pg_logger.rb -c "x = 1; y = 2"
