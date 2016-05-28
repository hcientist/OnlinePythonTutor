# to run on a specific input file: make infile=tests/fact.js
all:
	jshint jslogger.js && node --expose-debug-as=Debug jslogger.js $(infile)

# to run on a specific input file: make trace infile=tests/fact.js
trace:
	jshint jslogger.js && node --expose-debug-as=Debug jslogger.js --jsfile=/Users/pgbovine/Dropbox/opt-git/OnlinePythonTutor/v3/test-trace.js $(infile)

# to run on a specific input file: make pretty infile=tests/fact.js
pretty:
	jshint jslogger.js && node --expose-debug-as=Debug jslogger.js --prettydump=true $(infile)

tspretty:
	jshint jslogger.js && node --expose-debug-as=Debug jslogger.js --prettydump=true --typescript=true $(infile)

test:
	jshint jslogger.js && python golden_test.py --all

diffall:
	jshint jslogger.js && python golden_test.py --diffall

# run this before creating any Docker containers
# super weird -- need eval@0.1.0 or else line numbers don't show up on syntax errors!
deps:
	npm install eval@0.1.0 underscore minimist source-map typescript@1.4
	tar -xvf node-v6.0.0-linux-x64.tar.xz

docker:
	docker build -t="pgbovine/cokapi-js:v1" .

dockerbash:
	docker run -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-js:v1 bash
