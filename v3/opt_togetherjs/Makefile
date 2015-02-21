# --host 0.0.0.0 is required to make the server PUBLIC-FACING!

all:
	jshint server.js && node server.js --host 0.0.0.0 --port 30035

prod:
	jshint server.js && forever -l togetherjs_server.log server.js --host 0.0.0.0 --port 30035
