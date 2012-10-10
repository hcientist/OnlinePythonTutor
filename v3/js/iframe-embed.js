/*

Online Python Tutor
https://github.com/pgbovine/OnlinePythonTutor/

Copyright (C) 2010-2012 Philip J. Guo (philip@pgbovine.net)

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


// Pre-reqs: pytutor.js and jquery.ba-bbq.min.js should be imported BEFORE this file


// backend scripts to execute (Python 2 and 3 variants, if available)
//var python2_backend_script = 'web_exec_py2.py';
//var python3_backend_script = 'web_exec_py3.py';

// uncomment below if you're running on Google App Engine using the built-in app.yaml
var python2_backend_script = 'exec';
var python3_backend_script = null;


var myVisualizer = null; // singleton ExecutionVisualizer instance


$(document).ready(function() {

  var preseededCode = $.bbq.getState('code');
  var cumulativeState = $.bbq.getState('cumulative');
  if (!cumulativeState) {
    cumulativeState = 'false'; // string!
  }

  var pyState = $.bbq.getState('py');
  var verticalStackBool = ($.bbq.getState('verticalStack') == 'true'); // boolean

  var preseededCurInstr = Number($.bbq.getState('curInstr'));
  if (!preseededCurInstr) {
    preseededCurInstr = 0;
  }

  // TODO: add more options as needed
 


  var backend_script = null;
  if (pyState == '2') {
      backend_script = python2_backend_script;
  }
  else if (pyState == '3') {
      backend_script = python3_backend_script;
  }

  if (!backend_script) {
    alert('Error: This server is not configured to run Python ' + $('#pythonVersionSelector').val());
    return;
  }


  $.get(backend_script,
        {user_script : preseededCode, cumulative_mode: cumulativeState},
        function(dataFromBackend) {
          var trace = dataFromBackend.trace;
          
          // don't enter visualize mode if there are killer errors:
          if (!trace ||
              (trace.length == 0) ||
              (trace[trace.length - 1].event == 'uncaught_exception')) {

            if (trace.length == 1) {
              alert(trace[0].exception_msg);
            }
            else if (trace[trace.length - 1].exception_msg) {
              alert(trace[trace.length - 1].exception_msg);
            }
            else {
              alert("Whoa, unknown error! Reload to try again, or report a bug to philip@pgbovine.net\n\n(Click the 'Generate URL' button to include a unique URL in your email bug report.)");
            }
          }
          else {
            var startingInstruction = 0;

            // only do this at most ONCE, and then clear out preseededCurInstr
            if (preseededCurInstr && preseededCurInstr < trace.length) { // NOP anyways if preseededCurInstr is 0
              startingInstruction = preseededCurInstr;
            }

            myVisualizer = new ExecutionVisualizer('vizDiv',
                                                   dataFromBackend,
                                                   {startingInstruction: preseededCurInstr,
                                                    embeddedMode: true,
                                                    verticalStack: verticalStackBool,
                                                   });
          }
        },
        "json");


  // log a generic AJAX error handler
  $(document).ajaxError(function() {
    alert("Online Python Tutor server error (possibly due to memory/resource overload).");
  });


  // redraw connector arrows on window resize
  $(window).resize(function() {
    if (appMode == 'display') {
      myVisualizer.redrawConnectors();
    }
  });

});

