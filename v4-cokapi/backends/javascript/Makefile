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

deps:
	npm install eval underscore minimist source-map
	sudo npm install typescript # ugh need sudo
	#sudo npm link typescript # (maybe needed so that require('typescript') will work
