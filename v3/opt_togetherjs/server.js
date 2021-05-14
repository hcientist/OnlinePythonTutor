// 2014-05-08 Philip Guo forked this code from TogetherJS
// togetherjs/hub/server.js and started making modifications marked by
// 'pgbovine' in comments
//
// see Makefile for deployment/running options
//
// 2017-10-09: started extending this server with a /requestPublicHelp
// endpoint so that people can request help from anyone currently on the
// OPT website rather than needing to find their own tutors/peers to help them.
// (also added a /getHelpQueue endpoint to get the current help queue state)
//
// 2018-03-18: added a /serverStats endpoint to report on latest server stats
//
// 2018-05-04: added some security patches, now requires Node.js >= 8 (tested on v8.11.1 so far)

// Try to run with the following options to (hopefully!) prevent it from
// mysteriously crashing and failing to restart (use --spinSleepTime to
// wait a bit longer before attempting to restart it upon a crash)
//
// forever -a -l togetherjs.log --spinSleepTime 30000 -o togetherjs.out -e togetherjs.err start /home/pgbovine/OnlinePythonTutor/v3/opt_togetherjs/server.js --host 0.0.0.0 --port 30035

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// New Relic Server monitoring support
if ( process.env.NEW_RELIC_HOME ) {
  require("newrelic");
}

var SAMPLE_STATS_INTERVAL = 60*1000; // 1 minute
var SAMPLE_LOAD_INTERVAL = 5*60*1000; // 5 minutes
var EMPTY_ROOM_LOG_TIMEOUT = 3*60*1000; // 3 minutes

var WebSocketServer = require('websocket').server;
var WebSocketRouter = require('websocket').router;
var http = require('http');
var parseUrl = require('url').parse;
var fs = require('fs');
var requestFunc = require('request');

var child_process = require('child_process');

const zlib = require('zlib'); // https://nodejs.org/api/zlib.html

// FIXME: not sure what logger to use
//var logger = require('../../lib/logger');

// LOG_LEVEL values:
// 0: show everything (including debug)
// 1: don't show debug, do show logger.log
// 2: don't show logger.log and debug, do show logger.info (and STATS)
// 3: don't show info, do show warn
// 4: don't show warn, do show error
// 5: don't show anything
// Stats are at level 2

var thisSource = "// What follows is the source for the server.\n" +
    "// Obviously we can't prove this is the actual source, but if it isn't then we're \n" +
    "// a bunch of lying liars, so at least you have us on record.\n\n" +
    fs.readFileSync(__filename);

var ipStackApiKey = String(fs.readFileSync(__dirname + '/ipstack-geolocation/api-key.txt')).trim(); // pgbovine

var Logger = function (level, filename, stdout) {
  this.level = level;
  this.filename = filename;
  this.stdout = !!stdout;
  this._open();
  process.on("SIGUSR2", (function () {
    this._open();
  }).bind(this));
};

Logger.prototype = {

  write: function () {
    if (this.stdout) {
      console.log.apply(console, arguments);
    }
    if (this.file) {
      var s = [];
      for (var i=0; i<arguments.length; i++) {
        var a = arguments[i];
        if (typeof a == "string") {
          s.push(a);
        } else {
          s.push(JSON.stringify(a));
        }
      }
      s = s.join(" ") + "\n";
      this.file.write(this.date() + " " + s);
    }
  },

  date: function () {
    return (new Date()).toISOString();
  },

  _open: function () {
    if (this.file) {
      this.file.end(this.date() + " Logs rotating\n");
      this.file = null;
    }
    if (this.filename) {
      this.file = fs.createWriteStream(this.filename, {flags: 'a', mode: parseInt('644', 8), encoding: "UTF-8"});
    }
  }

};

[["error", 4], ["warn", 3], ["info", 2], ["log", 1], ["debug", 0]].forEach(function (nameLevel) {
  var name = nameLevel[0];
  var level = nameLevel[1];
  Logger.prototype[name] = function () {
    if (logLevel <= level) {
      if (name != "log") {
        this.write.apply(this, [name.toUpperCase()].concat(Array.prototype.slice.call(arguments)));
      } else {
        this.write.apply(this, arguments);
      }
    }
  };
});

// pgbovine - sanitize inputs for security
var USERNAME_RE = /user_\w\w\w/;
function isLegitUsername(s) {
  return (s && typeof(s) == 'string' && s.length === 8 && USERNAME_RE.test(s));
}

function sanitizedUrl(s) {
  if (!(s && typeof(s) == 'string')) {
    return null;
  }

  var myUrl = null;

  try {
    myUrl = parseUrl(s);
  } catch (e) {
    return null; // if you can't parse the URL, then it's definitely not legit
  }

  // URL should have a hash since that's where togetherjs id info is passed in
  if (!myUrl.hash) {
    return null;
  }

  var sanitizedDomain = null;
  // if pythontutor or localhost isn't in the domain, then it's not legit
  if (myUrl.hostname.toLowerCase().indexOf('www.pythontutor.com') >= 0) {
    sanitizedDomain = 'http://www.pythontutor.com/'; // canonicalize!
  } else if (myUrl.hostname.toLowerCase().indexOf('pythontutor.com') >= 0) {
    sanitizedDomain = 'http://pythontutor.com/'; // canonicalize!
  } else if (myUrl.hostname === 'localhost') {
    sanitizedDomain = 'http://localhost:' + myUrl.port + '/';
  } else {
    return null;
  }

  // strip '/' from pathnames to prevent weirdness
  var urlLib = require('url');
  var sanitizedUrl = urlLib.resolve(sanitizedDomain, myUrl.pathname.replace('/', '') + myUrl.hash);

  if (!sanitizedUrl) {
    console.log('ERROR in sanitizedUrl', s, sanitizedDomain, myUrl, sanitizedUrl);
  }
  return sanitizedUrl;
}


var logger = new Logger(0, null, true);

var server = http.createServer(function(request, response) {
  var url = parseUrl(request.url, true);
  var protocol = request.headers["forwarded-proto"] || "http:";
  var host = request.headers.host;
  var base = protocol + "//" + host;

  if (url.pathname == '/status') {
    response.end("OK");
  } else if (url.pathname == '/load') {
    var load = getLoad();
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.end("OK " + load.connections + " connections " +
                 load.sessions + " sessions; " +
                 load.solo + " are single-user and " +
                 (load.sessions - load.solo) + " active sessions");
  } else if (url.pathname == '/server-source') {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.end(thisSource);
  } else if (url.pathname == '/findroom') {
    if (request.method == "OPTIONS") {
      // CORS preflight
      corsAccept(request, response);
      return;
    }
    var prefix = url.query.prefix;
    var max = parseInt(url.query.max, 10);
    if (! (prefix && max)) {
      write400("You must include a valid prefix=CHARS&max=NUM portion of the URL", response);
      return;
    }
    if (prefix.search(/[^a-zA-Z0-9]/) != -1) {
      write400("Invalid prefix", response);
      return;
    }
    findRoom(prefix, max, response);
  } else if (url.pathname == '/requestPublicHelp') { // pgbovine - copied and pasted from /findroom
    if (request.method == "OPTIONS") {
      // CORS preflight
      corsAccept(request, response);
      return;
    }

    // sanity-check inputs
    if (!url.query.id) {
      console.log('ERROR: no url.query.id');
      response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }); // CORS?
      response.end(JSON.stringify({status: 'ERROR'}));
      return;
    }

    var logObj = createLogEntry(request);
    logObj.type = 'requestPublicHelp';

    if (url.query.removeFromQueue) {
      // if url.query.removeFromQueue, then remove from publicHelpRequestQueue:
      removeFromPHRQueue(url.query.id);

      // don't forget to log!!!
      logObj.query = url.query;
      pgLogWrite(logObj);

      // ... and then finish the HTTP response!
      response.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      });
      response.end(JSON.stringify({status: 'OKIE DOKIE'}));
    } else {
      var cleanUrl = sanitizedUrl(url.query.url);

      // sanity-check inputs
      if (!url.query.id || !url.query.lang || !isLegitUsername(url.query.username) || !cleanUrl) {
        console.log('ERROR 2:', url.query, isLegitUsername(url.query.username), cleanUrl);
        response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }); // CORS?
        response.end(JSON.stringify({status: 'ERROR'}));
        return;
      }
      url.query.url = cleanUrl; // substitute in cleaned URL

      // see ipstack-geolocation/ directory (not in GitHub) for more info
      // this call gets the geolocation of the client's current IP address.
      // note that we prefer to do this on the server rather than directly
      // from the browser since we get a more accurate IP address on the server:
      requestFunc("http://api.ipstack.com/" + String(logObj.ip) + '?access_key=' + ipStackApiKey, function(error, resp, body) {
        var geoResult;
        if (!error) {
          try {
            geoResult = JSON.parse(body);
          } catch (e) {
            // pass
          }
        }

        // add a COPY of the entire query object verbatim to the queue:
        var obj = Object.assign({}, url.query); // COPY!
        // add optional geographic info:
        obj.ip = logObj.ip;
        if (geoResult) {
          obj.country = geoResult.country_name;
          obj.city = geoResult.city;
          obj.region = geoResult.region_name;
          obj.latitude = geoResult.latitude;
          obj.longitude = geoResult.longitude;
        }

        // log the geo-enhanced obj
        logObj.query = obj;
        pgLogWrite(logObj);

        // then add to queue:
        addToPHRQueue(obj);

        // ... and then finish the HTTP response!
        response.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        });
        response.end(JSON.stringify({status: 'OKIE DOKIE'}));
      });
    }
  } else if (url.pathname == '/getHelpQueue') { // pgbovine
    if (request.method == "OPTIONS") {
      // CORS preflight
      corsAccept(request, response);
      return;
    }

    // copied from createLogEntry
    // Webfaction forwards IP addresses via proxy, so use this ...
    // http://stackoverflow.com/questions/8107856/how-can-i-get-the-users-ip-address-using-node-js
    var ip = request.remoteAddress /* check this FIRST since it's for WebSockets */ ||
      request.headers['x-forwarded-for'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      (request.connection.socket ? request.connection.socket.remoteAddress : null);
    var ipBasedId = 'IP_' + ip;

    // if we don't have a user_uuid, use IP address as the next best proxy for unique user identity
    var uniqueId = url.query.user_uuid;
    if (!uniqueId) {
      uniqueId = ipBasedId;
    }

    allRecentHelpQueueQueries.set(uniqueId, Object.assign({ip: ip}, url.query));

    response.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    // don't forget to pass in uniqueId since we want to know whether to
    // hide some entries on the queue based on whether uniqueId has been
    // banned from those sessions:
    response.end(JSON.stringify(getPHRStats(uniqueId, ipBasedId)));
  } else if (url.pathname == '/getNumObservers') { // pgbovine
    if (request.method == "OPTIONS") {
      // CORS preflight
      corsAccept(request, response);
      return;
    }

    // get number of *non-idle* OPT users who are observing the help queue,
    // split by their current programming language that they're working in
    var numObservers = {};
    for (var val of allRecentHelpQueueQueries.values()) {
      if (val.lang) {
        if (numObservers[val.lang] === undefined) {
          numObservers[val.lang] = 0;
        }
        numObservers[val.lang] += 1;
      }
    }

    response.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    response.end(JSON.stringify(numObservers));
  } else if (url.pathname == '/survey') { // pgbovine - just log a survey entry to the log
     if (request.method == "OPTIONS") {
      // CORS preflight
      corsAccept(request, response);
      return;
    }

    var surveyLogObj = createLogEntry(request);
    surveyLogObj.type = 'survey';
    surveyLogObj.query = url.query;
    pgLogWrite(surveyLogObj);

    response.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    response.end(JSON.stringify({status: 'OKIE DOKIE'}));
  } else if (url.pathname == '/nudge') { // pgbovine - just log an entry to the log
     if (request.method == "OPTIONS") {
      // CORS preflight
      corsAccept(request, response);
      return;
    }

    var nudgeLogObj = createLogEntry(request);
    nudgeLogObj.type = 'nudge';
    nudgeLogObj.query = url.query;
    pgLogWrite(nudgeLogObj);

    response.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    response.end(JSON.stringify({status: 'OKIE DOKIE'}));
  } else if (url.pathname == '/serverStats') {

    // reference code from /load endpoint ...
    //var load = getLoad();
    //response.writeHead(200, {"Content-Type": "text/plain"});
    //response.end("OK " + load.connections + " connections " +
    //             load.sessions + " sessions; " +
    //             load.solo + " are single-user and " +
    //             (load.sessions - load.solo) + " active sessions");

    // use "free -m" to get operating system memory stats:
    child_process.execFile('/usr/bin/free', ['-m'], (err, stdout, stderr) => {
      response.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      });
      var nowTime = Date.now();
      response.end(JSON.stringify({
                    curTime: nowTime,
                    queue: getPHRStats(undefined, undefined),
                    freem: {errcode: err ? err.code : null, stdout: stdout, stderr: stderr},
                    connectionStats: connectionStats}));
    });
  } else {
    write404(response);
  }
});

function corsAccept(request, response) {
  response.writeHead(200, {
    "Access-Control-Allow-Origin": "*"
  });
  response.end();
}

function write500(error, response) {
  response.writeHead(500, {"Content-Type": "text/plain"});
  if (typeof error != "string") {
    error = "\n" + JSON.stringify(error, null, "  ");
  }
  response.end("Error: " + error);
}

function write404(response) {
  response.writeHead(404, {"Content-Type": "text/plain"});
  response.end("Resource not found");
}

function write400(error, response) {
  response.writeHead(400, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
  response.end("Bad request: " + error);
}

function findRoom(prefix, max, response) {
  response.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  });
  var smallestNumber;
  var smallestRooms = [];
  for (var candidate in allConnections) {
    if (candidate.indexOf(prefix + "__") === 0) {
      var count = allConnections[candidate].length;
      if (count < max && (smallestNumber === undefined || count <= smallestNumber)) {
        if (smallestNumber === undefined || count < smallestNumber) {
          smallestNumber = count;
          smallestRooms = [candidate];
        } else {
          smallestRooms.push(candidate);
        }
      }
    }
  }
  var room;
  if (! smallestRooms.length) {
    room = prefix + "__" + generateId();
  } else {
    room = pickRandom(smallestRooms);
  }
  response.end(JSON.stringify({name: room}));
}

function generateId(length) {
  length = length || 10;
  var letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV0123456789';
  var s = '';
  for (var i=0; i<length; i++) {
    s += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return s;
}

function pickRandom(seq) {
  return seq[Math.floor(Math.random() * seq.length)];
}

function startServer(port, host) {
  server.listen(port, host, function() {
    logger.info('HUB Server listening on port ' + port + " interface: " + host + " PID: " + process.pid);
  });
}

var wsServer = new WebSocketServer({
    httpServer: server,
    // 10Mb max size (1Mb is default, maybe this bump is unnecessary)
    maxReceivedMessageSize: 0x1000000,
    // The browser doesn't seem to break things up into frames (not sure what this means)
    // and the default of 64Kb was exceeded; raised to 1Mb
    maxReceivedFrameSize: 0x100000,
    // Using autoaccept because the origin is somewhat dynamic
    // FIXME: make this smarter?
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // Unfortunately the origin will be whatever page you are sharing,
  // which could be any origin
  return true;
}

var allConnections = {};
var connectionStats = {};

var ID = 0;

wsServer.on('request', function(request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    logger.info('Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  var id = request.httpRequest.url.replace(/^\/+hub\/+/, '').replace(/\//g, "");
  if (! id) {
    request.reject(404, 'No ID Found');
    return;
  }

  // FIXME: we should use a protocol here instead of null, but I can't
  // get it to work.  "Protocol" is what the two clients are using
  // this channel for (we don't bother to specify this)
  var connection = request.accept(null, request.origin);
  connection.ID = ID++;
  if (! allConnections[id]) {
    allConnections[id] = [];
    var nowTime = Date.now();
    connectionStats[id] = {
      created: nowTime,
      lastMessageTime: nowTime, // pgbovine
      sample: [],
      clients: {},   // pgbovine - doesn't properly get DELETED, don't use this
      numClients: 0, // pgbovine - use this instead of the 'clients' field
      bannedUsers: [], // pgbovine - list of user_uuid's or IP addresses that have been kicked/banned from this session
      chatters: [],    // pgbovine - list of users who have actually chatted in this session
      numEditCodeEventsByClientId: {}, // pgbovine - key: clientId, value: number of editCode events by clientId
      domains: {},
      urls: {},
      firstDomain: null,
      totalMessageChars: 0,
      totalMessages: 0,
      connections: 0
    };
  }
  allConnections[id].push(connection);
  connectionStats[id].connections++;
  connectionStats[id].lastLeft = null;
  logger.debug('Connection accepted to ' + JSON.stringify(id) + ' ID:' + connection.ID);
  connection.sendUTF(JSON.stringify({
    type: "init-connection",
    peerCount: allConnections[id].length-1
  }));
  connection.on('message', function(message) {
    var parsed;
    var ip;
    try {
      parsed = JSON.parse(message.utf8Data);
    } catch (e) {
      logger.warn('Error parsing JSON: ' + JSON.stringify(message.utf8Data) + ": " + e);
      return;
    }
    connectionStats[id].clients[parsed.clientId] = true; // pgbovine - NB: this doesn't get properly deleted when clients leave the session, so don't use it
    connectionStats[id].numClients = allConnections[id].length; // pgbovine
    var domain = null;
    if (parsed.url) {
      domain = parseUrl(parsed.url).hostname;
      connectionStats[id].urls[parsed.url] = true;
    }
    if ((! connectionStats[id].firstDomain) && domain) {
      connectionStats[id].firstDomain = domain;
    }
    connectionStats[id].domains[domain] = true;
    connectionStats[id].totalMessageChars += message.utf8Data.length;
    connectionStats[id].totalMessages++;
    logger.debug('Message on ' + id + ' bytes: ' +
                 (message.utf8Data && message.utf8Data.length) +
                 ' conn ID: ' + connection.ID + ' data:' + message.utf8Data.substr(0, 20) +
                 ' connections: ' + allConnections[id].length);

    // ignore some kinds of extraneous noisy events
    if (parsed.type != 'cursor-update' &&
        parsed.type != 'scroll-update' &&
        parsed.type != 'keydown' &&
        parsed.type != 'form-init' &&
        parsed.type != 'form-focus' &&
        parsed.type != 'form-update' &&
        parsed.type != 'hello-back' &&
        parsed.type != 'app.codemirror-edit'
        ) {
      var logObj = createLogEntry(request);
      logObj.id = id;
      logObj.type = 'togetherjs';
      logObj.togetherjs = parsed;
      pgLogWrite(logObj);

      // only count a certain subset of "meaningful" messages in lastMessageTime
      // to avoid spurious signals of activity for non-events
      /* for reference, here's a rough count of the types of messages
       * seen in a ~1-week sample:
      4 app.syncAppState
      6 app.kickOutAgainBecauseSnuckBackIn
     16 url-change-nudge
    127 app.iGotKickedOut
    139 app.kickOut
    934 app.snapshotPeek
   1509 cursor-click
   3509 idle-status
   4446 peer-update
   4713 bye
   4846 app.initialAppState
   4851 hello
   4851 pg-hello-geolocate
   5219 app.myAppState
   5857 app.requestSync
  13611 app.hashchange
  15373 chat
  20749 app.pyCodeOutputDivScroll
  38293 app.executeCode
  39572 app.editCode
  60295 app.updateOutput
  */
      if (parsed.type == 'app.editCode' ||
          parsed.type == 'app.executeCode' ||
          parsed.type == 'app.updateOutput' ||
          parsed.type == 'chat') {
        if (parsed.type == 'app.editCode') {
          editCodeStats = connectionStats[id].numEditCodeEventsByClientId;
          if (editCodeStats[parsed.clientId] === undefined) {
            editCodeStats[parsed.clientId] = 1;
          } else {
            editCodeStats[parsed.clientId] += 1;
            // only update lastMessageTime if it's NOT your first editCode event
            // in order to prevent counting an idle session from being
            // misleadingly marked as non-idle in the UI just because someone
            // peeked their head into a session to see what's going on
            // but didn't actually do anything meaningful. otherwise
            // there's a bunch of 'false positives' where a session is
            // displayed in the UI as non-idle even though no activity
            // has taken place within that session
            connectionStats[id].lastMessageTime = Date.now(); // pgbovine
          }
        } else {
          // always update lastMessageTime
          connectionStats[id].lastMessageTime = Date.now(); // pgbovine
        }
      }

      // pgbovine
      if (parsed.type == 'chat') {
        var chatters = connectionStats[id].chatters;
        var cid = connection.ID;
        if (chatters.indexOf(cid) < 0) {
          chatters.push(cid);
        }
      }
    }

    // handle kicked/banned users:
    if (parsed.type === 'app.iGotKickedOut') {
      var bannedUsers = connectionStats[id].bannedUsers;

      // try to use the user_uuid of the banned user, but if that fails,
      // then use the IP address of the banned user ... remember that
      // iGotKickedOut is issued (shamefully) by the user who was kicked/banned:
      //
      // update on 2019-03-26 -- always use IP address here so that a kicked/
      // banned user can't simply start a new browser session and get back in
      // (but this may result in false positives of, say, an entire
      // classroom's IP address being inadvertently banned from a session)
      //var uniqueId = parsed.user_uuid;
      var uniqueId = null;
      if (!uniqueId) {
        // copied from createLogEntry
        // Webfaction forwards IP addresses via proxy, so use this ...
        // http://stackoverflow.com/questions/8107856/how-can-i-get-the-users-ip-address-using-node-js
        ip = request.remoteAddress /* check this FIRST since it's for WebSockets */ ||
          request.headers['x-forwarded-for'] ||
          request.connection.remoteAddress ||
          request.socket.remoteAddress ||
          (request.connection.socket ? request.connection.socket.remoteAddress : null);
        uniqueId = 'IP_' + ip;
      }
      if (bannedUsers.indexOf(uniqueId) < 0) {
        bannedUsers.push(uniqueId);
      }
      //console.log(connectionStats[id].bannedUsers);
    }

    // when you first enter a session (i.e., saying 'hello'), try to geolocate
    // your IP address server-side (since it's more accurate than doing it
    // client-side) and then log/send a pg-hello-geolocate event to everyone
    //
    // 2018-06-22: *disable* this feature (set to if(false)) since ipstack.com
    // limits number of API calls per month, so we don't want to exceed limits!
    if (false) {
    //if (parsed.type === 'hello') {
      // copied from createLogEntry
      // Webfaction forwards IP addresses via proxy, so use this ...
      // http://stackoverflow.com/questions/8107856/how-can-i-get-the-users-ip-address-using-node-js
      ip = request.remoteAddress /* check this FIRST since it's for WebSockets */ ||
        request.headers['x-forwarded-for'] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        (request.connection.socket ? request.connection.socket.remoteAddress : null);


      // see ipstack-geolocation/ directory (not in GitHub) for more info
      requestFunc("http://api.ipstack.com/" + String(ip) + '?access_key=' + ipStackApiKey, function(error, resp, body) {
        var geoResult;
        if (!error) {
          try {
            geoResult = JSON.parse(body);
          } catch (e) {
            // pass
          }
        }

        if (geoResult) {
          var helloExtraLogEntry = {type: 'pg-hello-geolocate',
                                    geo: geoResult,
                                    clientId: parsed.clientId,
                                    user_uuid: parsed.user_uuid};

          var extraLogObj = createLogEntry(request);
          extraLogObj.id = id;
          extraLogObj.type = 'togetherjs';
          extraLogObj.togetherjs = helloExtraLogEntry;
          pgLogWrite(extraLogObj);

          if (allConnections && allConnections[id]) { // guard against potential crash that i saw in logs
            for (var i=0; i<allConnections[id].length; i++) {
              var c = allConnections[id][i];
              if (c == connection && !parsed["server-echo"]) {
                continue;
              }
              c.sendUTF(JSON.stringify(helloExtraLogEntry));
            }
          }

        }
      });
    }

    for (var i=0; i<allConnections[id].length; i++) {
      var c = allConnections[id][i];
      if (c == connection && !parsed["server-echo"]) {
        continue;
      }
      if (message.type === 'utf8') {
        c.sendUTF(message.utf8Data);
      } else if (message.type === 'binary') {
        c.sendBytes(message.binaryData);
      }
    }
  });
  connection.on('close', function(reasonCode, description) {
    if (! allConnections[id]) {
      // Got cleaned up entirely, somehow?
      logger.info("Connection ID", id, "was cleaned up entirely before last connection closed");
      return;
    }
    var index = allConnections[id].indexOf(connection);
    if (index != -1) {
      // pgbovine - if the FIRST client disconnects, then remove this
      // connection id from the help queue (if it's on it). this is because
      // we assume the first client is the one who initiated the help
      // request, so if they're no longer online, then there's no point
      // in keeping it on the help queue.
      if (index === 0) {
        removeFromPHRQueue(id);
      }
      allConnections[id].splice(index, 1);
    }
    connectionStats[id].numClients = allConnections[id].length; // pgbovine
    // pgbovine - remove from chatters if found:
    var chatters = connectionStats[id].chatters;
    var curInd = chatters.indexOf(connection.ID);
    if (curInd != -1) {
      chatters.splice(curInd, 1);
    }

    if (! allConnections[id].length) {
      delete allConnections[id];
      connectionStats[id].lastLeft = Date.now();
      connectionStats[id].created = null; // pgbovine
      connectionStats[id].chatters = [];  // pgbovine
      removeFromPHRQueue(id); // pgbovine - remove from help queue if all clients disconnected
    }
    logger.debug('Peer ' + connection.remoteAddress + ' disconnected, ID: ' + connection.ID);

    var logObj = createLogEntry(request, 'websocket-connection-closed');
    logObj.id = id;
    pgLogWrite(logObj);
  });
});

// periodically clean up connectionStats so that it doesn't grow out of  control:
setInterval(function () {
  for (var id in connectionStats) {
    if (connectionStats[id].lastLeft && Date.now() - connectionStats[id].lastLeft > EMPTY_ROOM_LOG_TIMEOUT) {
      //logStats(id, connectionStats[id]);
      delete connectionStats[id]; // clean up!!!
      continue;
    }

    // pgbovine - don't sample since it will just take up space
    /*
    var totalClients = countClients(connectionStats[id].clients);
    var connections = 0;
    if (allConnections[id]) {
      connections = allConnections[id].length;
    }

    connectionStats[id].sample.push({
      time: Date.now(),
      totalClients: totalClients,
      connections: connections
    });
    */
  }
}, SAMPLE_STATS_INTERVAL);

// pgbovine - kill these since they seem unnecessary for OPT
/*
setInterval(function () {
  for (var id in connectionStats) {
    if (connectionStats[id].lastLeft && Date.now() - connectionStats[id].lastLeft > EMPTY_ROOM_LOG_TIMEOUT) {
      logStats(id, connectionStats[id]);
      delete connectionStats[id];
      continue;
    }
    var totalClients = countClients(connectionStats[id].clients);
    var connections = 0;
    if (allConnections[id]) {
      connections = allConnections[id].length;
    }
    connectionStats[id].sample.push({
      time: Date.now(),
      totalClients: totalClients,
      connections: connections
    });
  }
}, SAMPLE_STATS_INTERVAL);

setInterval(function () {
  var load = getLoad();
  load.time = Date.now();
  logger.info("LOAD", JSON.stringify(load));
}, SAMPLE_LOAD_INTERVAL);
*/

function getLoad() {
  var sessions = 0;
  var connections = 0;
  var empty = 0;
  var solo = 0;
  for (var id in allConnections) {
    if (allConnections[id].length) {
      sessions++;
      connections += allConnections[id].length;
      if (allConnections[id].length == 1) {
        solo++;
      }
    } else {
      empty++;
    }
  }
  return {
    sessions: sessions,
    connections: connections,
    empty: empty,
    solo: solo
  };
}

function countClients(clients) {
  var n = 0;
  for (var clientId in clients) {
    n++;
  }
  return n;
}

function logStats(id, stats) {
  logger.info("STATS", JSON.stringify({
    id: id,
    created: stats.created,
    sample: stats.sample,
    totalClients: countClients(stats.clients),
    totalMessageChars: stats.totalMessageChars,
    totalMessages: stats.totalMessages,
    domain: stats.firstDomain || null,
    domainCount: countClients(stats.domains),
    urls: countClients(stats.urls)
  }));
}

if (require.main == module) {
  var ops = require('optimist')
      .usage("Usage: $0 [--port 8080] [--host=localhost] [--log=filename] [--log-level=N]")
      .describe("port", "The port to server on (default $HUB_SERVER_PORT, $PORT, $VCAP_APP_PORT, or 8080")
      .describe("host", "The interface to serve on (default $HUB_SERVER_HOST, $HOST, $VCAP_APP_HOST, 127.0.0.1).  Use 0.0.0.0 to make it public")
      .describe("log-level", "The level of logging to do, from 0 (very verbose) to 5 (nothing) (default $LOG_LEVEL or 0)")
      .describe("log", "A file to log to (default stdout)")
      .describe("stdout", "Log to both stdout and the log file");
  var port = ops.argv.port || process.env.HUB_SERVER_PORT || process.env.VCAP_APP_PORT ||
      process.env.PORT || 8080;
  var host = ops.argv.host || process.env.HUB_SERVER_HOST || process.env.VCAP_APP_HOST ||
      process.env.HOST || '127.0.0.1';
  var logLevel = 5; // pgbovine -- set default to no logging for simplicity
  var stdout = ops.argv.stdout || !ops.argv.log;
  if (ops.argv['log-level']) {
    logLevel = parseInt(ops.argv['log-level'], 10);
  }
  logger = new Logger(logLevel, ops.argv.log, stdout);
  if (ops.argv.h || ops.argv.help) {
    console.log(ops.help());
    process.exit();
  } else {
    startServer(port, host);
  }
}

exports.startServer = startServer;


// pgbovine - logging infrastructure

function createLogEntry(req, event_type) {
  var obj = {};

  // Webfaction forwards IP addresses via proxy, so use this ...
  // http://stackoverflow.com/questions/8107856/how-can-i-get-the-users-ip-address-using-node-js
  var ip = req.remoteAddress /* check this FIRST since it's for WebSockets */ ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);

  obj.ip = ip;
  obj.date = (new Date()).toISOString();
  if (event_type) {
    obj.type = event_type;
  }

  return obj;
}


// pgbovine - TogetherJS administrator hub

var pgLogFile = null;

var MAX_LOG_SIZE = 10000;
//var MAX_LOG_SIZE = 5; // for testing
var curLogSize = 0;

function pgLogWrite(logObj) {
  var s = JSON.stringify(logObj);
  //console.log(s); // debug

  // rotate log every MAX_LOG_SIZE entries
  if (!pgLogFile || curLogSize >= MAX_LOG_SIZE) {
    if (pgLogFile) {
      const fpath = pgLogFile.path; // grab its path first, then ...
      pgLogFile.end();              // ... end the prior log file

      // zip up the recently-completed log file and then delete the
      // original, to save space

      // if fpath no longer exists for some reason, then crash and let
      // 'forever' restart the server
      const recentlyCompletedLogFile = fs.createReadStream(fpath);

      const gzip = zlib.createGzip();
      const out = fs.createWriteStream(fpath + '.gz',
                                      {flags: 'w',
                                       mode: parseInt('644', 8),
                                       encoding: "UTF-8"});

      recentlyCompletedLogFile.pipe(gzip).pipe(out).on('finish', (err) => {
        out.end();
        // if there weren't errors, delete the original non-zipped version of file when you're done
        if (!err) {
          fs.unlink(fpath, (err) => {});
        }
      });
    }
    var filename = 'log_' + logObj.date + '.json';
    var pathname = require('path').resolve(__dirname, filename);
    pgLogFile = fs.createWriteStream(pathname,
                                     {flags: 'w',
                                      mode: parseInt('644', 8),
                                      encoding: "UTF-8"});
    curLogSize = 0;
  }

  // I think this write is buffered in memory, so it's safe to do
  // multiple "concurrent" writes since it will all be buffered
  // http://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback
  pgLogFile.write(s + '\n');
  curLogSize++;
}


// use the 'methods' below to manipulate the queue instead of directly
// mutating it, since we can do logging in those functions
var publicHelpRequestQueue = []; // pgbovine

function addToPHRQueue(obj) {
  // avoid duplicates
  var found = false;
  for (var i=0; i < publicHelpRequestQueue.length; i++) {
    if (publicHelpRequestQueue[i].id === obj.id) {
      found = true;
      break;
    }
  }
  if (!found) {
    publicHelpRequestQueue.push(obj);
    logPHRStats(); // log right *after* there's a change to the queue
  }
}

function removeFromPHRQueue(id) {
  var foundIndex = -1;
  for (var i = 0; i < publicHelpRequestQueue.length; i++) {
    if (publicHelpRequestQueue[i].id === id) {
      foundIndex = i;
      break;
    }
  }
  if (foundIndex != -1) {
    publicHelpRequestQueue.splice(foundIndex, 1);
    logPHRStats(); // log right *after* there's a change to the queue
  }
}

function getPHRStats(uniqueId, ipBasedId) {
  var ret = [];
  publicHelpRequestQueue.forEach(function(e) {
    var timeSinceCreation;
    var timeSinceLastMsg;
    var numClients;
    var numChatters;

    var stat = connectionStats[e.id];
    if (stat) {
      var now = Date.now();
      if (stat.created) {
        timeSinceCreation = now - stat.created;
      }
      if (stat.lastMessageTime) {
        timeSinceLastMsg = now - stat.lastMessageTime;
      }
      numClients = stat.numClients;
      numChatters = stat.chatters.length;

      // 2019-03-26: since we are always enforcing bannedUsers by IP
      // addresses now, DON'T use uniqueId inside here; use ipBasedId

      // only enforce if ipBasedId has been passed in ...
      if (ipBasedId && stat.bannedUsers) {
        for (var i=0; i < stat.bannedUsers.length; i++) {
          var elt = stat.bannedUsers[i];
          if (elt === ipBasedId) {
            return; // GET OUTTA HERE EARLY! we've been banned from this session, so don't add this to the list
          }
        }
      }
    }

    var copy = Object.assign({}, e); // COPY!
    copy.timeSinceCreation = timeSinceCreation;
    copy.timeSinceLastMsg = timeSinceLastMsg;
    copy.numClients = numClients;
    copy.numChatters = numChatters;

    ret.push(copy);
  });
  return ret;
}

// a set of help queries made using /getHelpQueue within the past minute or so,
// which gives a rough indicator of how many people are currently logged onto
// the OPT website at the moment. Reset this periodically.
// Key: user_uuid or ip address starting with 'IP_'
// Value: JSON string of current app state of this user
var allRecentHelpQueueQueries = new Map();

function logPHRStats() {
  // periodically log the help queue stats:
  var logObj = {};
  logObj.date = (new Date()).toISOString();
  logObj.type = 'PHRStats';
  logObj.queue = getPHRStats(undefined, undefined);
  logObj.recentQueries = [...allRecentHelpQueueQueries]; // spread operator
  pgLogWrite(logObj);
  //console.log(logObj);
}

function logPHRandResetHelpQueries() {
  logPHRStats();

  // start over again so that we count only who's been querying in the
  // past minute or so ...
  allRecentHelpQueueQueries.clear();
}

setInterval(logPHRandResetHelpQueries, 60*1000); // production: sample every 1 minute so as not to overwhelm logs

// end pgbovine
