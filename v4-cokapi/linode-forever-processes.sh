#!/bin/sh
echo "start `date`" >> /home/pgbovine/crontab-status.txt
cd /home/pgbovine/OnlinePythonTutor/v4-cokapi && /home/pgbovine/node-v6.9.5-linux-x64/bin/forever -a -l /home/pgbovine/.forever/cokapi.log start cokapi.js > /home/pgbovine/cokapi.out 2> /home/pgbovine/cokapi.err
cd /home/pgbovine/OnlinePythonTutor/v4-cokapi && /home/pgbovine/node-v6.9.5-linux-x64/bin/forever -a -l /home/pgbovine/.forever/cokapi-https.log start cokapi.js https > /home/pgbovine/cokapi-https.out 2> /home/pgbovine/cokapi-https.err
