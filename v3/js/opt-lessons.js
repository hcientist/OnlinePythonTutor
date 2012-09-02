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

var backend_script = 'exec'; // URL of backend script, which must eventually call pg_logger.py

var myVisualizer = null; // singleton ExecutionVisualizer instance

function parseLessonFile(dat) {
  var toks = dat.split('======');
  var lessonScript = toks[0].rtrim();
  var metadataJSON = $.parseJSON(toks[1]);
  console.log(lessonScript);
  console.log(metadataJSON);

  $.get(backend_script,
        {user_script : lessonScript},
        function(dataFromBackend) {
          var trace = dataFromBackend.trace;
          
          // don't enter visualize mode if there are killer errors:
          if (!trace ||
              (trace.length == 0) ||
              (trace[trace.length - 1].event == 'uncaught_exception')) {

            if (trace.length == 1) {
              alert(trace[0].exception_msg);
            }
            else {
              alert("Whoa, unknown error! Reload to try again, or report a bug to philip@pgbovine.net\n\n(Click the 'Generate URL' button to include a unique URL in your email bug report.)");
            }
          }
          else {
            myVisualizer = new ExecutionVisualizer('pyOutputPane',
                                                   dataFromBackend,
                                                   {embeddedMode: true});

            myVisualizer.updateOutput();

            // grab focus so that keyboard events work
            myVisualizer.grabKeyboardFocus();
          }
        },
        "json");
}

$(document).ready(function() {

  $.get("lessons/aliasing.txt", parseLessonFile);

  // log a generic AJAX error handler
  $(document).ajaxError(function() {
    alert("Server error (possibly due to memory/resource overload).");
  });


  // redraw connector arrows on window resize
  $(window).resize(function() {
    if (myVisualizer) {
      myVisualizer.redrawConnectors();
    }
  });

});
