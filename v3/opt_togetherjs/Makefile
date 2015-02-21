all:
	jshint server.js && node server.js --port 30035

prod:
	jshint server.js && forever -l togetherjs_server.log server.js --port 30035
