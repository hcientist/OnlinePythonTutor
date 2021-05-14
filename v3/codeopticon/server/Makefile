all:
	jshint codeopticon-server.js && node codeopticon-server

prod:
	jshint codeopticon-server.js && forever -l codeopticon-server.log start codeopticon-server.js &
