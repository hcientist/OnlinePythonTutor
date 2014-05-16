/*

Online Python Tutor
https://github.com/pgbovine/OnlinePythonTutor/

Copyright (C) 2010-2014 Philip J. Guo (philip@pgbovine.net)

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


// simplified version of opt-frontend.js for ../composingprograms.html


// Pre-reqs:
// - pytutor.js
// - jquery.ba-bbq.min.js
// - opt-frontend-common.js
// should all be imported BEFORE this file

function executeCode(forceStartingInstr) {
    backend_script = python3_backend_script; // Python 3

    var backendOptionsObj = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
                             heap_primitives: false,
                             show_only_outputs: false,
                             py_crazy_mode: false,
                             origin: 'composingprograms.js'};

    var startingInstruction = forceStartingInstr ? forceStartingInstr : 0;

    var frontendOptionsObj = {startingInstruction: startingInstruction,
                              executeCodeWithRawInputFunc: executeCodeWithRawInput,
                              updateOutputCallback: function() {$('#urlOutput,#embedCodeOutput').val('');},
                              compactFuncLabels: true,
                             }

    executePythonCode(pyInputCodeMirror.getValue(),
                      backend_script, backendOptionsObj,
                      frontendOptionsObj,
                      'pyOutputPane',
                      enterDisplayMode, handleUncaughtExceptionFunc);
}

$(document).ready(function() {
  // be friendly to the browser's forward and back buttons
  // thanks to http://benalman.com/projects/jquery-bbq-plugin/
  $(window).bind("hashchange", function(e) {
    updateAppDisplay($.bbq.getState('mode'));
  });

  genericOptFrontendReady(); // initialize at the end
});
