all:
	jshint cokapi.js && node cokapi.js

local:
	jshint cokapi.js && node cokapi.js local

# start both http and https servers
prod:
	jshint cokapi.js && forever -l cokapi.log start cokapi.js &
	jshint cokapi.js && forever -l cokapi-https.log start cokapi.js https &

# make dependencies for cokapi
deps:
	npm install express
	npm install -g jshint
	npm install -g forever
