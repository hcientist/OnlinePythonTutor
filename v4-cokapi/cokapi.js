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

// VERY IMPORTANT - turn on the sandbox when deploying online, or else
// you'll be executing untrusted code on your server!
var USE_DOCKER_SANDBOX = false;

var assert = require('assert');
var child_process = require('child_process');
var express = require('express');
var serveStatic = require('serve-static');


var app = express();

app.use(serveStatic('frontends/')); // put all static files in here

app.get('/exec_py2', function(req, res) {
  if (USE_DOCKER_SANDBOX) {
    assert(false);
  } else {
    executePython('python', req, res);
  }
});

app.get('/exec_py3', function(req, res) {
  if (USE_DOCKER_SANDBOX) {
    assert(false);
  } else {
    executePython('python3', req, res);
  }
});

app.get('/exec_js', function(req, res) {
  if (USE_DOCKER_SANDBOX) {
    assert(false);
  } else {
    var usrCod = req.query.user_script;
    var args = ['--expose-debug-as=Debug',
                'backends/javascript/jslogger.js',
                '--jsondump=true',
                '--code=' + usrCod];

    var child = child_process.spawn('node', args);
    var stdoutDat = '';
    child.stdout.on('data', function(data) {
      stdoutDat += data;
    });
    child.on('close', function(code) {
      res.send(String(stdoutDat));
    });
  }
});

function executePython(pythonExe, req, res) {
  var parsedOptions = JSON.parse(req.query.options_json);

  var usrCod = req.query.user_script;
  var usrInputJson = req.query.raw_input_json;
  var cumulativeMode = parsedOptions.cumulative_mode;
  var heapPrimitives = parsedOptions.heap_primitives;

  var args = ['backends/python/generate_json_trace.py'];
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

  var child = child_process.spawn(pythonExe, args);
  var stdoutDat = '';
  child.stdout.on('data', function(data) {
    stdoutDat += data;
  });
  child.on('close', function(code) {
    res.send(String(stdoutDat));
  });
}

var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
