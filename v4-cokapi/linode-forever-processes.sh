#!/bin/sh
cd /home/pgbovine/OnlinePythonTutor/v4-cokapi && /home/pgbovine/node-v6.9.5-linux-x64/bin/forever -a -l cokapi.log start cokapi.js
cd /home/pgbovine/OnlinePythonTutor/v4-cokapi && /home/pgbovine/node-v6.9.5-linux-x64/bin/forever -a -l cokapi-https.log start cokapi.js https
cd /home/pgbovine/OnlinePythonTutor/v4-cokapi && /home/pgbovine/node-v6.9.5-linux-x64/bin/forever -a -l cokapi-http3000.log start cokapi.js http3000
cd /home/pgbovine/OnlinePythonTutor/v4-cokapi && /home/pgbovine/node-v6.9.5-linux-x64/bin/forever -a -l cokapi-https8001.log start cokapi.js https8001
