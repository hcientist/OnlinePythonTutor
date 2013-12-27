/*

Online Python Tutor
https://github.com/pgbovine/OnlinePythonTutor/

Copyright (C) 2010-2013 Philip J. Guo (philip@pgbovine.net)

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


// backend scripts to execute (Python 2 and 3 variants, if available)
// make two copies of ../web_exec.py and give them the following names,
// then change the first line (starting with #!) to the proper version
// of the Python interpreter (i.e., Python 2 or Python 3).
// Note that your hosting provider might have stringent rules for what
// kind of scripts are allowed to execute. For instance, my provider
// (Webfaction) seems to let scripts execute only if permissions are
// something like:
// -rwxr-xr-x 1 pgbovine pgbovine 2.5K Jul  5 22:46 web_exec_py2.py*
// (most notably, only the owner of the file should have write
//  permissions)
//var python2_backend_script = 'web_exec_py2.py';
//var python3_backend_script = 'web_exec_py3.py';

// uncomment below if you're running on Google App Engine using the built-in app.yaml
var python2_backend_script = 'exec';
var python3_backend_script = 'exec';

// KRAZY experimental KODE!!! Use a custom hacked CPython interpreter
var python2crazy_backend_script = 'web_exec_py2-crazy.py';
// On Google App Engine, simply run dev_appserver.py with the
// crazy custom py2crazy CPython interpreter to get 2crazy mode
//var python2crazy_backend_script = 'exec';


var domain = "http://pythontutor.com/"; // for deployment
//var domain = "http://localhost:8080/"; // for Google App Engine local testing


var rawInputLst = []; // a list of strings inputted by the user in response to raw_input or mouse_input events


function getQueryStringOptions() {
  // note that any of these can be 'undefined'
  var preseededCode = $.bbq.getState('code');
  var preseededCurInstr = Number($.bbq.getState('curInstr'));
  var pyState = $.bbq.getState('py');
  var verticalStack = $.bbq.getState('verticalStack');
  var heapPrimitives = $.bbq.getState('heapPrimitives');
  var drawParentPointers = $.bbq.getState('drawParentPointers');
  var textRefs = $.bbq.getState('textReferences');
  var showOnlyOutputs = $.bbq.getState('showOnlyOutputs');
  var cumulativeState = $.bbq.getState('cumulative');

  return {preseededCode: preseededCode,
          preseededCurInstr: preseededCurInstr,
          pyState: pyState,
          verticalStack: verticalStack,
          heapPrimitives: heapPrimitives,
          drawParentPointers: drawParentPointers,
          textRefs: textRefs,
          showOnlyOutputs: showOnlyOutputs,
          cumulativeState: cumulativeState};
}


function executePythonCode(pythonSourceCode,
                           backendScript, backendOptionsObj,
                           frontendOptionsObj,
                           outputDiv,
                           handleSuccessFunc, handleUncaughtExceptionFunc) {
    if (!backendScript) {
      alert('Server configuration error: No backend script');
      return;
    }

    $.get(backendScript,
          {user_script : pythonSourceCode,
           raw_input_json: rawInputLst.length > 0 ? JSON.stringify(rawInputLst) : '',
           options_json: JSON.stringify(backendOptionsObj)},
          function(dataFromBackend) {
            var trace = dataFromBackend.trace;

            // don't enter visualize mode if there are killer errors:
            if (!trace ||
                (trace.length == 0) ||
                (trace[trace.length - 1].event == 'uncaught_exception')) {

              handleUncaughtExceptionFunc(trace);

              if (trace.length == 1) {
                alert(trace[0].exception_msg);
              }
              else if (trace[trace.length - 1].exception_msg) {
                alert(trace[trace.length - 1].exception_msg);
              }
              else {
                alert("Unknown error. Reload to try again," +
                      "or report a bug to philip@pgbovine.net\n\n" +
                      "(Click the 'Generate URL' button to include a " + 
                      "unique URL in your email bug report.)");
              }
            }
            else {
              // fail-soft to prevent running off of the end of trace
              if (frontendOptionsObj.startingInstruction >= trace.length) {
                frontendOptionsObj.startingInstruction = 0;
              }

              if (frontendOptionsObj.holisticMode) {
                myVisualizer = new HolisticVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);
              } else {
                myVisualizer = new ExecutionVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);

                // set keyboard bindings
                // VERY IMPORTANT to clear and reset this every time or
                // else the handlers might be bound multiple times
                $(document).unbind('keydown');
                $(document).keydown(function(k) {
                  if (k.keyCode == 37) { // left arrow
                    if (myVisualizer.stepBack()) {
                      k.preventDefault(); // don't horizontally scroll the display
                    }
                  }
                  else if (k.keyCode == 39) { // right arrow
                    if (myVisualizer.stepForward()) {
                      k.preventDefault(); // don't horizontally scroll the display
                    }
                  }
                });
              }

              handleSuccessFunc();
            }
          },
          "json");
}
