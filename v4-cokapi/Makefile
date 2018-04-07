all:
	jshint cokapi.js && node cokapi.js

local:
	jshint cokapi.js && node cokapi.js local

# start both http and https servers
prod:
	jshint cokapi.js && forever -l cokapi.log start cokapi.js &
	jshint cokapi.js && forever -l cokapi-https.log start cokapi.js https &

deps:
	npm install express
