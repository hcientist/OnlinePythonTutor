# Docker-specific targets

# build a docker container
all:
	docker build -t="pgbovine/cokapi-js:v1" .

test:
	docker run -m 512M -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-js:v1 /tmp/javascript/node-v6.0.0-linux-x64/bin/node --expose-debug-as=Debug /tmp/javascript/jslogger.js --jsondump=true --code="var x=1; var y=2; var z=3;"

regtest:
	# run regression test suite as root
	docker run -m 512M -t -i --rm --net=none --cap-drop all -w /tmp/javascript pgbovine/cokapi-js:v1 python golden_test.py --all

bash:
	docker run -m 512M -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-js:v1 bash


# older targets

# to run on a specific input file: make infile=tests/fact.js
run:
	jshint jslogger.js && node --expose-debug-as=Debug jslogger.js $(infile)

# to run on a specific input file: make trace infile=tests/fact.js
trace:
	jshint jslogger.js && node --expose-debug-as=Debug jslogger.js --jsfile=/Users/pgbovine/Dropbox/opt-git/OnlinePythonTutor/v3/test-trace.js $(infile)

# to run on a specific input file: make pretty infile=tests/fact.js
pretty:
	jshint jslogger.js && node --expose-debug-as=Debug jslogger.js --prettydump=true $(infile)

tspretty:
	jshint jslogger.js && node --expose-debug-as=Debug jslogger.js --prettydump=true --typescript=true $(infile)

goldentest:
	jshint jslogger.js && python golden_test.py --all

diffall:
	jshint jslogger.js && python golden_test.py --diffall

deps:
	tar -xvf node-v6.0.0-linux-x64.tar.xz
	npm install # rely on package.json
