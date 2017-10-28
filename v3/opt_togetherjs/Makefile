# --host 0.0.0.0 is required to make the server PUBLIC-FACING!

all:
	jshint server.js && node server.js --host 0.0.0.0 --port 30035

deps:
	npm install -g jshint forever # install globally
	npm install websocket optimist request # install locally

prod:
	#jshint server.js && forever -l togetherjs_server.log server.js --host 0.0.0.0 --port 30035

	# Try to run with the following options to (hopefully!) prevent it from
	# mysteriously crashing and failing to restart (use --spinSleepTime to
	# wait a bit longer before attempting to restart it upon a crash)
	#
	# on Linode:
	forever -a -l togetherjs.log --spinSleepTime 30000 -o togetherjs.out -e togetherjs.err start /home/pgbovine/OnlinePythonTutor/v3/opt_togetherjs/server.js --host 0.0.0.0 --port 30035 &
