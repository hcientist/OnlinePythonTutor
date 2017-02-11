cd ~/OnlinePythonTutor/v4-cokapi && jshint cokapi.js && forever -a -l cokapi.log start cokapi.js &
cd ~/OnlinePythonTutor/v4-cokapi && jshint cokapi.js && forever -a -l cokapi-https.log start cokapi.js https &
forever -a -l togetherjs.log --spinSleepTime 30000 -o togetherjs.out -e togetherjs.err start /home/pgbovine/OnlinePythonTutor/v3/opt_togetherjs/server.js --host 0.0.0.0 --port 30035 &
