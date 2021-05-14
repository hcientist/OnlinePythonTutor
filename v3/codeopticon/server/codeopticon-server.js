// simple OPT event logger for Codeopticon using socket.io
// Created on 2015-01-29 by Philip Guo
//
// start this server using forever codeopticon-server.js but set this up
// first:

/* the problem with Linux defaults is that you can only have 1024 file
   descriptors open (check with 'ulimit -n'), but each socket takes up
   one file descriptor, so when there are lots of connected users, more
   users can't connect on. let's up the limit to 1000000 by:

sudo vi /etc/security/limits.conf

then add these lines to the file:

<username> soft nofile 1000000
<username> hard nofile 1000000

and when you log out and back in, running

'ulimit -n' should return 1000000

And hopefully we should be able to open more than ~1024 sockets (default
number).

Check number of open sockets using:
netstat -tn

*/

// For debugging, run with:
// http://socket.io/docs/logging-and-debugging/
//
// DEBUG=* node yourfile.js
//
// DEBUG=* forever -l codeopticon-server.log start codeopticon-server.js &

var PRODUCTION_RUN = true; // set to true when running in production

var PRODUCTION_PORT = 5000;
var DEBUG_PORT = 5001;

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var util = require('util');
var zlib = require('zlib');

if (PRODUCTION_RUN) {
  var TIMER_INTERVAL_MS = 30 * 1000; // how frequently to check for idle
  var IDLE_DISCONNECT_TIME_MS = 15 * 60 * 1000; // if you're idling for this long after your last event, then disconnect
} else {
  // small values for testing
  //var TIMER_INTERVAL_MS = 1000;
  //var IDLE_DISCONNECT_TIME_MS = 10 * 1000;

  var TIMER_INTERVAL_MS = 30 * 1000;
  var IDLE_DISCONNECT_TIME_MS = 15 * 60 * 1000;
}


//var LOG_VERSION = 1; // did not compress backendDataJSON
//var LOG_VERSION = 2; // compress backendDataJSON into backendDataJSONz
                       // using http://nodejs.org/api/zlib.html
//var LOG_VERSION = 3; // try to auto-disconnect idle clients to prevent
                     // too many sockets from being kept open, and added
                     // a 'killed' field to opt-client-disconnect to
                     // indicate whether disconnection was FORCED
//var LOG_VERSION = 4; // added a reconnectAttempts field to
                     // opt-client-event entries, which is non-null when
                     // the client attempts to RECONNECT to the server
                     // after being auto-disconnected (i.e., kicked off)
//var LOG_VERSION = 5; // drastically shorten the auto-disconnect time and
                     // make a few tweaks to try to stop it from getting overloaded
//var LOG_VERSION = 6; // run with "ulimit -n 1000000" to see if that's
                     // enough file descriptors for sockets to prevent
                     // auto-disconnect when traffic is high. see note at top of this file
var LOG_VERSION = 7; // deployed 2015-03-07 -- added some fields to 'updateOutput' event type


var numConnections = 0; // nasty global!
var clientIdToSocket = {};

var assert = require('assert');

function emitEvent(obj) {
  // augment with version number:
  obj.v = LOG_VERSION;

  console.log('emitEvent', obj);

  // send to all observers
  observerSockets.forEach(function(e, i) {
    e.emit('logEvent', obj);
  });
}

var userIO = io.of('/userlog'); // custom namespace
userIO.on('connection', function(socket) {
  numConnections++;
  clientIdToSocket[socket.id] = socket;

  var lastEventTime = null;
  var forcedKill = false;

  var killTimer = setInterval(function() {
    var curTime = new Date().getTime();
    if (lastEventTime) {
      millisecondsSinceLastEvent = curTime - lastEventTime;

      if (!PRODUCTION_RUN) {
        console.log('ping:', millisecondsSinceLastEvent);
      }

      if (millisecondsSinceLastEvent > IDLE_DISCONNECT_TIME_MS) {
        forcedKill = true;
        socket.disconnect();
      }
    }
  }, TIMER_INTERVAL_MS /* check interval */);

  var clientIP = socket.request.connection.remoteAddress;
  var clientUserAgent = socket.handshake.headers['user-agent'];
  var payload = {eventType: 'opt-client-connect',
                 serverTime: new Date().getTime(),
                 sid: socket.id,
                 userAgent: clientUserAgent,
                 ip: clientIP,
                 nConns: numConnections};
  emitEvent(payload);

  socket.on('disconnect', function() {
    clearInterval(killTimer);
    numConnections--;
    var payload = {eventType: 'opt-client-disconnect',
                   serverTime: new Date().getTime(),
                   sid: socket.id,
                   ip: clientIP,
                   nConns: numConnections,
                   killed: forcedKill};
    emitEvent(payload);

    delete clientIdToSocket[socket.id];
  });

  socket.on('opt-client-event', function(msg) {
    // record server time as soon as event comes in
    var serverTime = new Date().getTime();

    lastEventTime = serverTime;

    if (msg.type === 'doneExecutingCode') {
      // optimize by compressing backendDataJSON into backendDataJSONz

      // TODO: look into using higher compression levels like
      // zlib.Z_BEST_COMPRESSION, which can't use a convenience function
      // or use something like https://github.com/cscott/compressjs
      zlib.gzip(msg.backendDataJSON, function(err, result) {
        var payload = {eventType: 'opt-client-event',
                       serverTime: serverTime,
                       sid: socket.id,
                       ip: clientIP,
                       data: msg};
        if (!err) {
          msg.backendDataJSONz = result;
        } else {
          // in the worst case, just encode the entry without the trace
          // and with a short error message
          msg.err = 'zlib.gzip error';
        }
        delete msg.backendDataJSON; // boom!
        emitEvent(payload);
      });
    } else {
      // fast unoptimized case
      var payload = {eventType: 'opt-client-event',
                     serverTime: serverTime,
                     sid: socket.id,
                     ip: clientIP,
                     data: msg};
      emitEvent(payload);

      // special handling for chat events
      if (msg.type === 'opt-client-chat') {
        // broadcast, so it will probably go wonky if there's more than
        // one observer
        observerSockets.forEach(function(e, i) {
          e.emit('opt-client-chat', msg);
        });
      }
    }
  });
});


var observerSockets = [];
var observerIO = io.of('/codeopticon-observer'); // custom namespace
observerIO.on('connection', function(socket) {
  observerSockets.push(socket);
  console.log('codeopticon-observer connected', observerSockets.length);

  socket.on('opt-codeopticon-observer-chat', function(msg) {
    var userSid = msg.targetSid;
    var userSocket = clientIdToSocket[userSid];
    if (userSocket) {
      userSocket.emit('opt-codeopticon-observer-chat', msg);
    }
  });

  socket.on('disconnect', function() {
    var pos = observerSockets.indexOf(socket);
    assert(pos >= 0);
    observerSockets.splice(pos, 1); // remove
    console.log('codeopticon-observer disconnected', observerSockets.length);
  });
});


http.listen(PRODUCTION_RUN ? PRODUCTION_PORT : DEBUG_PORT, function(){
  console.log('listening on port %s', PRODUCTION_RUN ? PRODUCTION_PORT : DEBUG_PORT);
});
