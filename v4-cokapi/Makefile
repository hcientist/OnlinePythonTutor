all:
	jshint cokapi.js && node cokapi.js

# start both http and https servers
prod:
	jshint cokapi.js && forever -l cokapi.log start cokapi.js &
	jshint cokapi.js && forever -l cokapi-https.log start cokapi.js https &

deps:
	npm install express
	#npm install express jshint serve-static sqlite3
