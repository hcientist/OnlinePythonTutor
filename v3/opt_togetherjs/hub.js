// created on 2014-04-29 by Philip Guo

// To install on Webfaction, run:
// npm install express
// npm install node-uuid


// using SSE for now since Websockets seem too complicated
// http://www.html5rocks.com/en/tutorials/eventsource/basics/

var fs = require('fs');
var url = require('url');
var uuid = require('node-uuid');
var express = require('express');
var app = express();

var EventEmitter = require('events').EventEmitter;
var learnerEmitter = new EventEmitter(); // sending events to learners
var adminEmitter = new EventEmitter();   // sending events to administrators

var helpQueue = [];
var helpAvailable = false;

app.get('/toggle-help-available', function(req, res) {
  helpAvailable = !helpAvailable;
  res.end(String(helpAvailable));

  var ha = {type: 'ha', helpAvailable: helpAvailable};
  learnerEmitter.emit('help-available-update', ha);
  adminEmitter.emit('help-available-update', ha);
});


// all learners on pythontutor.com connect to this SSE feed
app.get('/learner-SSE', function(req, res) {
  // set up Server-Sent Event header
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // with CORS action
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  function sendDat() {
    var helpQueueUniqueUrls = {};
    var numUniqueUrls = 0;
    for (var i=0; i < helpQueue.length; i++) {
      var u = helpQueue[i].url;
      if (helpQueueUniqueUrls[u] === undefined) {
        numUniqueUrls++;
        helpQueueUniqueUrls[u] = true;
      }
    }
    var dat = {helpAvailable: helpAvailable,
               helpQueueUrls: numUniqueUrls};
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
});


// admin.html connects to this SSE feed
app.get('/admin-SSE', function(req, res) {
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
                      fetchTime: (new Date()).toUTCString(),
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
});

function constructSSE(res, data) {
  res.write('data: ' + JSON.stringify(data) + '\n\n');
}

// TODO: how come express.static doesn't work?
app.get('/admin.html', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(fs.readFileSync(__dirname + '/admin.html'));
  res.end();
});

// when a learner requests help ...
app.get('/request-help', function(req, res) {
  res.writeHead(200, {'Access-Control-Allow-Origin': '*'}); // CORS action

  if (!helpAvailable) {
    res.end("failure");
    return; // early return!
  }

  // Webfaction forwards IP addresses via proxy, so use this ...
  // http://stackoverflow.com/questions/8107856/how-can-i-get-the-users-ip-address-using-node-js
  var ip = req.headers['x-forwarded-for'] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  req.query.ip = ip;
  req.query.id = uuid.v4(); // use randomly-generated UUID
  req.query.timestr = (new Date()).toUTCString();
  req.query.type = 'new-help-request';

  // if you're already on the queue, don't insert a duplicate:
  for (var i=0; i < helpQueue.length; i++) {
    if (helpQueue[i].url == req.query.url) {
      res.end("failure");
      return; // early return!
    }
  }

  helpQueue.push(req.query);
  res.end("success");

  learnerEmitter.emit('new-help-request', req.query);
  adminEmitter.emit('new-help-request', req.query);
});

// clear the entire queue
app.get('/clear-help-queue', function(req, res) {
  // clear helpQueue QUICKLY
  // http://stackoverflow.com/questions/1232040/how-to-empty-an-array-in-javascript
  while (helpQueue.length > 0) {
    helpQueue.pop();
  }

  res.end("success");
  learnerEmitter.emit('help-queue-update');
});

// remove an element from the queue with id=<id>
app.get('/remove-help-queue-element', function(req, res) {
  var q = req.query;
  for (var i = 0; i < helpQueue.length; i++) {
    if (helpQueue[i].id == q.id) {
      helpQueue.splice(i, 1);
      learnerEmitter.emit('help-queue-update');
      res.end("success");
      return;
    }
  }

  res.end("failure");
});

app.listen(11961); // the port that Webfaction assigned to this app


// DEPRECATED
/*
app.get('/help-queue-SSE', function(req, res) {
  // set up Server-Sent Event header
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // on page load, first fetch ALL elements in a batch. this event also
  // fires after the client loses a connection and auto-reconnects.
  var firstTimeDat = {type: 'firstTime',
                      helpQueue: helpQueue,
                      fetchTime: (new Date()).toUTCString(),
                      // approximate number of learners connected and
                      // listening to help-available-update
                      numLearners: EventEmitter.listenerCount(myEmitter, 'help-available-update')};
  constructSSE(res, firstTimeDat);

  function f(e) {constructSSE(res, e);};
  myEmitter.on('new-help-request', f);

  console.log('help-queue-SSE:', 
              EventEmitter.listenerCount(myEmitter, 'new-help-request'),
              'listeners');

  // Why does this "close" event get triggered on page reload and
  // browser window close?!? OHHHHH this connection isn't normally
  // closing since we didn't explicitly do res.end() to close the
  // connection. The client is just being kept waiting indefinitely, and
  // it ain't gonna close on its own.
  req.on('close', function() {
    // clean up after yourself to prevent too many open connections
    myEmitter.removeListener('new-help-request', f);
  });
});

app.get('/help-available-SSE', function(req, res) {
  // set up Server-Sent Event header
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // with CORS action
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  constructSSE(res, String(helpAvailable));

  function sendHA(e) {
    constructSSE(res, String(helpAvailable));
  };
  myEmitter.on('help-available-update', sendHA);

  console.log('help-available-SSE:', 
              EventEmitter.listenerCount(myEmitter, 'help-available-update'),
              'listeners');

  req.on('close', function() {
    // clean up after yourself to prevent too many open connections
    myEmitter.removeListener('help-available-update', sendHA);
  });
});
*/

