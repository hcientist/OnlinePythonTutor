# --host 0.0.0.0 is required to make the server PUBLIC-FACING!

all:
	jshint server.js && node server.js --host 0.0.0.0 --port 30035

deps:
	npm install websocket optimist

prod:
	#jshint server.js && forever -l togetherjs_server.log server.js --host 0.0.0.0 --port 30035
	# on Linode:
	forever -a -l togetherjs.log --spinSleepTime 30000 -o togetherjs.out -e togetherjs.err start /home/pgbovine/OnlinePythonTutor/v3/opt_togetherjs/server.js --host 0.0.0.0 --port 30035 &
