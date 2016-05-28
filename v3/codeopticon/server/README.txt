---
2016-05-28

The original Codeopticon server from 2015 used mongodb for logging, but
I've cut that out to simplify the code for now. Misc. code and notes
related to mongodb:

// on Linode, install mongo using:
// sudo apt-get install mongodb-clients
// sudo apt-get install mongodb-server
//
// and start using:
// sudo service mongodb start
//
// to access on the command line:
// mongo optlog
// db.events.count()
//

// See: https://github.com/mongodb/node-mongodb-native
var MongoClient = require('mongodb').MongoClient;

var mongodbConn = null; // this will be initialized when db connected
var mongodbCollection = null; // this will be initialized when db connected

var url = 'mongodb://localhost:27017/optlog';

// TODO: when should we disconnect the mongo client?!? is this causing a
// memory leak?
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  mongodbConn = db; // TODO: when should we CLOSE this connection?
  if (PRODUCTION_RUN) {
    mongodbCollection = db.collection('events'); // global!
  } else {
    mongodbCollection = db.collection('debug_temp_events'); // global!
  }
});

