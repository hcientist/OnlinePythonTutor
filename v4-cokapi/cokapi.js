/*

Online Python Tutor
https://github.com/pgbovine/OnlinePythonTutor/

Copyright (C) Philip J. Guo (philip@pgbovine.net)

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

// This is a nodejs server based on express that serves the v4-cokapi/ app
// To test locally, run 'make' and load http://localhost:3000/

// Run with an 'https' command-line flag to use https (must have
// the proper certificate and key files, though)

var IS_DEBUG = false;

var PRODUCTION_PORT = 3000;
var PRODUCTION_HTTPS_PORT = 8001;
var DEBUG_PORT = 5001;

// VERY IMPORTANT - turn on the sandbox when deploying online, or else
// you'll be executing untrusted code on your server!
var USE_DOCKER_SANDBOX = true;

var assert = require('assert');
var child_process = require('child_process');
var express = require('express');
var util = require('util');


// We use this to execute since it supports utf8 and also an optional
// timeout, but it needs the exact location of binaries because it doesn't
// spawn a shell
// http://nodejs.org/api/child_process.html#child_process_child_process_execfile_file_args_options_callback

var NODE_BIN = '/usr/local/bin/node';
var PYTHON2_BIN = '/usr/bin/python';
var PYTHON3_BIN = '/usr/local/bin/python3.3';

var TIMEOUT_SECS = 3;
var JAVA_TIMEOUT_SECS = 15; // the Java backend is SUPER SLOW :/


// bind() res and useJSONP before using
function postExecHandler(res, useJSONP, err, stdout, stderr) {
  if (err) {
    console.log('postExecHandler', util.inspect(err, {depth: null}));
    var errTrace;
    if (err.killed) {
      // timeout!
      errTrace = {code: '', trace: [{'event': 'uncaught_exception',
                                     'exception_msg': 'Timeout error. Your code ran for more than ' + TIMEOUT_SECS + ' seconds. Please shorten and try again.'}]};
      if (useJSONP) {
        res.jsonp(errTrace /* return an actual object, not a string */);
      } else {
        res.send(JSON.stringify(errTrace));
      }
    } else {
      errTrace = {code: '', trace: [{'event': 'uncaught_exception',
                                     'exception_msg': "Unknown error. Report a bug to philip@pgbovine.net by clicking on the\n'Generate URL' button at the bottom and including a URL in your email."}]};
      if (useJSONP) {
        res.jsonp(errTrace /* return an actual object, not a string */);
      } else {
        res.send(JSON.stringify(errTrace));
      }
    }
  } else {
    if (useJSONP) {
      try {
        // stdout better be real JSON, or we've got a problem!!!
        var stdoutParsed = JSON.parse(stdout);
        res.jsonp(stdoutParsed /* return an actual object, not a string */);
      } catch(e) {
        errTrace = {code: '', trace: [{'event': 'uncaught_exception',
                                     'exception_msg': "Unknown error. Report a bug to philip@pgbovine.net by clicking on the\n'Generate URL' button at the bottom and including a URL in your email."}]};
        res.jsonp(errTrace /* return an actual object, not a string */);
      }
    } else {
      res.send(stdout);
    }
  }
}


var app = express();

// http://ilee.co.uk/jsonp-in-express-nodejs/
app.set("jsonp callback", true);

app.get('/exec_py2', function(req, res) {
  executePython('py2', req, res);
});

app.get('/exec_py3', function(req, res) {
  executePython('py3', req, res);
});

app.get('/exec_js', exec_js_handler.bind(null, false, false));
app.get('/exec_js_jsonp', exec_js_handler.bind(null, true, false));

app.get('/exec_ts', exec_js_handler.bind(null, false, true));
app.get('/exec_ts_jsonp', exec_js_handler.bind(null, true, true));

function exec_js_handler(useJSONP /* use bind first */, isTypescript /* use bind first */, req, res) {
  var usrCod = req.query.user_script;

  var exeFile;
  var args = [];

  if (USE_DOCKER_SANDBOX) {
    // this needs to match the docker setup in Dockerfile
    exeFile = '/usr/bin/docker'; // absolute path to docker executable
    args.push('run', '--rm', '--user=netuser', '--net=none', '--cap-drop', 'all', 'pgbovine/cokapi:v1',
              //'node', // built-in Node.js version
              '/tmp/javascript/node-v6.0.0-linux-x64/bin/node', // custom Node.js version
              '--expose-debug-as=Debug',
              '/tmp/javascript/jslogger.js');
  } else {
    assert(false);
    //exeFile = NODE_BIN;
    //args.push('--expose-debug-as=Debug',
    //          'backends/javascript/jslogger.js');
  }
  if (isTypescript) {
    args.push('--typescript=true');
  }
  args.push('--jsondump=true');
  args.push('--code=' + usrCod);

  child_process.execFile(exeFile, args,
                         {timeout: TIMEOUT_SECS * 1000 /* milliseconds */,
                          maxBuffer: 5000 * 1024 /* 5MB data max */,
                          // make SURE docker gets the kill signal;
                          // this signal seems to allow docker to clean
                          // up after itself to --rm the container, but
                          // double-check with 'docker ps -a'
                          killSignal: 'SIGINT'},
                         postExecHandler.bind(null, res, useJSONP));
}

app.get('/exec_java', exec_java_handler.bind(null, false));
app.get('/exec_java_jsonp', exec_java_handler.bind(null, true));

// runs David Pritchard's Java backend in backends/java/
function exec_java_handler(useJSONP /* use bind first */, req, res) {
  var usrCod = req.query.user_script;

  var parsedOptions = JSON.parse(req.query.options_json);
  var heapPrimitives = parsedOptions.heap_primitives;

  var exeFile;
  var args = [];

  var inputObj = {};
  inputObj.usercode = usrCod;
  // TODO: add options, arg, and stdin later ...
  inputObj.options = {};
  inputObj.args = [];
  inputObj.stdin = "";

  // VERY unintuitive -- to get strings to display as heap objects and
  // NOT 'primitive' values in the Java backend, set showStringsAsValues
  // to false
  if (heapPrimitives) {
    inputObj.options.showStringsAsValues = false;
  }

  var inputObjJSON = JSON.stringify(inputObj);

  if (USE_DOCKER_SANDBOX) {
    // this needs to match the docker setup in Dockerfile
    exeFile = '/usr/bin/docker'; // absolute path to docker executable
    args.push('run', '--rm', '--user=netuser', '--net=none', '--cap-drop', 'all', 'pgbovine/cokapi:v1',
              '/tmp/run-java-backend.sh',
              inputObjJSON);
  } else {
    assert(false);
  }

  child_process.execFile(exeFile, args,
                         {timeout: JAVA_TIMEOUT_SECS * 1000 /* milliseconds */,
                          maxBuffer: 5000 * 1024 /* 10MB data max */,
                          // make SURE docker gets the kill signal;
                          // this signal seems to allow docker to clean
                          // up after itself to --rm the container, but
                          // double-check with 'docker ps -a'
                          killSignal: 'SIGINT'},
                         postExecHandler.bind(null, res, useJSONP));
}

app.get('/exec_ruby', exec_ruby_handler.bind(null, false));
app.get('/exec_ruby_jsonp', exec_ruby_handler.bind(null, true));

function exec_ruby_handler(useJSONP /* use bind first */, req, res) {
  var usrCod = req.query.user_script;

  var exeFile;
  var args = [];

  if (USE_DOCKER_SANDBOX) {
    // this needs to match the docker setup in Dockerfile
    exeFile = '/usr/bin/docker'; // absolute path to docker executable
    args.push('run', '--rm', '--user=netuser', '--net=none', '--cap-drop', 'all', 'pgbovine/cokapi:v1',
              '/tmp/ruby/ruby',
              '/tmp/ruby/pg_logger.rb',
              '-c',
              usrCod);
  } else {
    assert(false);
    // must use Docker
  }

  child_process.execFile(exeFile, args,
                         {timeout: TIMEOUT_SECS * 1000 /* milliseconds */,
                          maxBuffer: 5000 * 1024 /* 5MB data max */,
                          // make SURE docker gets the kill signal;
                          // this signal seems to allow docker to clean
                          // up after itself to --rm the container, but
                          // double-check with 'docker ps -a'
                          killSignal: 'SIGINT'},
                         postExecHandler.bind(null, res, useJSONP));
}

function executePython(pyVer, req, res) {
  var parsedOptions = JSON.parse(req.query.options_json);

  var usrCod = req.query.user_script;
  var usrInputJson = req.query.raw_input_json;
  var cumulativeMode = parsedOptions.cumulative_mode;
  var heapPrimitives = parsedOptions.heap_primitives;

  var exeFile;
  var args = [];

  if (USE_DOCKER_SANDBOX) {
    // this needs to match the docker setup in Dockerfile
    exeFile = '/usr/bin/docker'; // absolute path to docker executable
    args.push('run', '--rm', '--user=netuser', '--net=none', '--cap-drop', 'all', 'pgbovine/cokapi:v1',
              (pyVer == 'py2' ? 'python' : 'python3'),
              '/tmp/python/generate_json_trace.py');
  } else {
    assert(false);
    //exeFile = (pyVer == 'py2' ? PYTHON2_BIN : PYTHON3_BIN);
    //args.push('backends/python/generate_json_trace.py');
  }

  if (cumulativeMode) {
    args.push('-c');
  }
  if (heapPrimitives) {
    args.push('-p');
  }
  if (usrInputJson) {
    args.push('--input=' + usrInputJson);
  }
  args.push('--code=' + usrCod);

  child_process.execFile(exeFile, args,
                         {timeout: TIMEOUT_SECS * 1000 /* milliseconds */,
                          maxBuffer: 5000 * 1024 /* 5MB data max */,
                          // make SURE docker gets the kill signal;
                          // this signal seems to allow docker to clean
                          // up after itself to --rm the container, but
                          // double-check with 'docker ps -a'
                          killSignal: 'SIGINT'},
                         postExecHandler.bind(null, res, false));
}

// https support
var https = require('https');
var fs = require('fs');

var options = {
  key: fs.readFileSync('cokapi.com.key'),
  cert: fs.readFileSync('cokapi.com-BUNDLE.crt')
};

var args = process.argv.slice(2);
if (args.length > 0 && args[0] === 'https') {
  var server = https.createServer(options, app).listen(
    IS_DEBUG ? DEBUG_PORT : PRODUCTION_HTTPS_PORT,
    function() {
      var host = server.address().address;
      var port = server.address().port;
      console.log('https app listening at http://%s:%s', host, port);
  });
} else {
  var server = app.listen(
    IS_DEBUG ? DEBUG_PORT : PRODUCTION_PORT,
    function() {
      var host = server.address().address;
      var port = server.address().port;
      console.log('http app listening at http://%s:%s', host, port);
  });
}
