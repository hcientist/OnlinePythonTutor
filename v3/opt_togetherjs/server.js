// 2014-05-08 Philip Guo forked this code from TogetherJS
// togetherjs/hub/server.js and started making modifications marked by
// 'pgbovine' in comments

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
  }
  // administrator hub ...
  else if (url.pathname == '/toggle-help-available') {
    toggleHelpAvailable(request, response);
  } else if (url.pathname == '/learner-SSE') {
    learnerSSE(request, response);
  } else if (url.pathname == '/admin-SSE') {
    adminSSE(request, response);
  } else if (url.pathname == '/request-help') {
    requestHelp(url, request, response);
  } else if (url.pathname == '/clear-help-queue') {
    clearHelpQueue(request, response);
  } else if (url.pathname == '/remove-help-queue-element') {
    removeHelpQueueElement(url, request, response);
  } else if (url.pathname == '/admin.html') {
    adminHTML(request, response);
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
    connectionStats[id] = {
      created: Date.now(),
      sample: [],
      clients: {},
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
    try {
      parsed = JSON.parse(message.utf8Data);
    } catch (e) {
      logger.warn('Error parsing JSON: ' + JSON.stringify(message.utf8Data) + ": " + e);
      return;
    }
    connectionStats[id].clients[parsed.clientId] = true;
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

    // ignore some kinds of extraneous events
    if (parsed.type != 'cursor-update' &&
        parsed.type != 'scroll-update' &&
        parsed.type != 'keydown' &&
        parsed.type != 'form-init' &&
        parsed.type != 'form-focus' &&
        parsed.type != 'form-update' &&
        parsed.type != 'hello-back'
        ) {
      var logObj = createLogEntry(request, 'help-available');
      logObj.id = id;
      logObj.type = 'togetherjs';
      logObj.togetherjs = parsed;
      pgLogWrite(logObj);
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
      allConnections[id].splice(index, 1);
    }
    if (! allConnections[id].length) {
      delete allConnections[id];
      connectionStats[id].lastLeft = Date.now();
    }
    logger.debug('Peer ' + connection.remoteAddress + ' disconnected, ID: ' + connection.ID);
  });
});

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
  obj = {};

  // Webfaction forwards IP addresses via proxy, so use this ...
  // http://stackoverflow.com/questions/8107856/how-can-i-get-the-users-ip-address-using-node-js
  var ip = req.remoteAddress /* check this FIRST since it's for WebSockets */ ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  obj['ip'] = ip;
  obj['date'] = (new Date()).toISOString();
  obj['type'] = event_type;

  return obj;
}


// pgbovine - TogetherJS administrator hub

var pgLogFile = null;
var catchallLogFile = fs.createWriteStream('log_CATCHALL.json',
                                           {flags: 'a',
                                            mode: parseInt('644', 8),
                                            encoding: "UTF-8"});

var EventEmitter = require('events').EventEmitter;
var learnerEmitter = new EventEmitter(); // sending events to learners
var adminEmitter = new EventEmitter();   // sending events to administrators

// to prevent warnings when a bunch of learners sign online
learnerEmitter.setMaxListeners(100);
adminEmitter.setMaxListeners(100);

var helpQueue = [];
var helpAvailable = false;

function pgLogWrite(logObj) {
  var s = JSON.stringify(logObj);
  //console.log(s); // debug

  if (pgLogFile) {
    pgLogFile.write(s + '\n');
  }
  else {
    // a slush of everything that's not covered by a real log file, to
    // see what falls between the cracks
    catchallLogFile.write(s + '\n');
  }
}

function toggleHelpAvailable(req, res) {
  helpAvailable = !helpAvailable;
  res.end(String(helpAvailable));

  var logObj = createLogEntry(req, 'help-available');
  logObj.helpAvailable = helpAvailable;

  learnerEmitter.emit('help-available-update', logObj);
  adminEmitter.emit('help-available-update', logObj);

  // use this event to segment log files
  if (helpAvailable) { // just turned ON helpAvailable
    if (pgLogFile) {
      pgLogFile.end();
    }
    var filename = 'log_' + logObj.date + '.json';
    pgLogFile = fs.createWriteStream(filename,
                                     {flags: 'w',
                                      mode: parseInt('644', 8),
                                      encoding: "UTF-8"});
    pgLogWrite(logObj); // write this as the FIRST entry
  }
  else { // just turned OFF helpAvailable
    pgLogWrite(logObj); // write this as the FINAL entry
    pgLogFile.end();
    pgLogFile = null;
  }
}


// all learners on pythontutor.com connect to this SSE feed
function learnerSSE(req, res) {
  // set up Server-Sent Event header
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // with CORS action
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  function sendDat() {
    var dat = {helpAvailable: helpAvailable,
               helpQueueUrls: helpQueue.length};
    constructSSE(res, dat);
  };

  learnerEmitter.on('help-available-update', sendDat);
  learnerEmitter.on('help-queue-update', sendDat);
  learnerEmitter.on('new-help-request', sendDat);

  req.on('close', function() {
    // clean up after yourself to prevent too many open connections
    learnerEmitter.removeListener('help-available-update', sendDat);
    learnerEmitter.removeListener('help-queue-update', sendDat);
    learnerEmitter.removeListener('new-help-request', sendDat);
  });

  sendDat(); // send an initial burst of data
}


// admin.html connects to this SSE feed
function adminSSE(req, res) {
  // set up Server-Sent Event header
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // this happens right when a client connects or after the client loses
  // connection and auto-reconnects:
  var firstTimeDat = {type: 'firstTime',
                      helpQueue: helpQueue,
                      helpAvailable: helpAvailable,
                      fetchTime: (new Date()).toISOString(),
                      numLearners: EventEmitter.listenerCount(learnerEmitter,
                                                              'help-available-update')};
  constructSSE(res, firstTimeDat); // send an initial burst of data

  function f(e) {constructSSE(res, e);};
  adminEmitter.on('new-help-request', f);
  adminEmitter.on('help-available-update', f);

  // Why does this "close" event get triggered on page reload and
  // browser window close?!? OHHHHH this connection isn't normally
  // closing since we didn't explicitly do res.end() to close the
  // connection. The client is just being kept waiting indefinitely, and
  // it ain't gonna close on its own.
  req.on('close', function() {
    // clean up after yourself to prevent too many open connections
    adminEmitter.removeListener('new-help-request', f);
    adminEmitter.removeListener('help-available-update', f);
  });
}

function constructSSE(res, data) {
  res.write('data: ' + JSON.stringify(data) + '\n\n');
}

function adminHTML(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(fs.readFileSync(__dirname + '/admin.html'));
}

// when a learner requests help ...
function requestHelp(url, req, res) {
  res.writeHead(200, {'Access-Control-Allow-Origin': '*'}); // CORS action
  if (!helpAvailable) {
    res.end("failure");
    return; // early return!
  }

  var logObj = createLogEntry(req, 'new-help-request');
  logObj.url = url.query.url;
  logObj.id = url.query.id;

  // if you're already on the queue, don't insert a duplicate:
  for (var i=0; i < helpQueue.length; i++) {
    if (helpQueue[i].id == logObj.id) {
      res.end("failure");
      return; // early return!
    }
  }

  helpQueue.push(logObj);
  res.end("success");

  learnerEmitter.emit('new-help-request', logObj);
  adminEmitter.emit('new-help-request', logObj);

  pgLogWrite(logObj);
}

// clear the entire queue
function clearHelpQueue(req, res) {
  // clear helpQueue QUICKLY
  // http://stackoverflow.com/questions/1232040/how-to-empty-an-array-in-javascript
  while (helpQueue.length > 0) {
    var elt = helpQueue.pop();
    var logObj = createLogEntry(req, 'remove-help-request');
    logObj.id = elt.id;
    pgLogWrite(logObj);
  }

  res.end("success");
  learnerEmitter.emit('help-queue-update');
}

// remove an element from the queue with id=<id> and optional reason=<reason>
function removeHelpQueueElement(url, req, res) {
  for (var i = 0; i < helpQueue.length; i++) {
    if (helpQueue[i].id == url.query.id) {
      helpQueue.splice(i, 1);
      res.end("success");
      learnerEmitter.emit('help-queue-update');

      var logObj = createLogEntry(req, 'remove-help-request');
      logObj.id = url.query.id;
      logObj.reason = url.query.reason;
      pgLogWrite(logObj);
      return;
    }
  }

  res.end("failure");
}

// end pgbovine
