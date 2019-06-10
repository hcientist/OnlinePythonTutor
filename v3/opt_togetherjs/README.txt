---
This is the server for OPT shared sessions and live help mode

server.js is forked from TogetherJS togetherjs/hub/server.js on
2014-05-08 and augmented with extra logging and an admin interface

To run both locally and online, use:

node server.js --host 0.0.0.0 --port 30035


to run at startup from a script called by cron, use absolute paths:

/home/pgbovine/node-v6.9.5-linux-x64/bin/forever -a -l /home/pgbovine/.forever/togetherjs.log --spinSleepTime 30000 -o /home/pgbovine/togetherjs.out -e /home/pgbovine/togetherjs.err start /home/pgbovine/OnlinePythonTutor/v3/opt_togetherjs/server.js --host 0.0.0.0 --port 30035 > /home/pgbovine/togetherjs.out 2> /home/pgbovine/togetherjs.err

---

To test this on localhost, change hubBase in
v5-unity/js/lib/togetherjs/togetherjs-min.js to point to localhost:

  hubBase: "http://localhost:30035/",     // pgbovine - localhost testing
