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


// TODO: refactor to be more like composingprograms.js and use more
// of the common functionality in opt-frontend-common.js


// custom version of opt-frontend.js for ../matrixtutor.html

var originFrontendJsFile = 'matrixtutor.js';

// Pre-reqs:
// - pytutor.js
// - jquery.ba-bbq.min.js
// - opt-frontend-common.js
// should all be imported BEFORE this file

var problemName = null;

var appMode = 'edit'; // 'edit', 'display', or 'display_no_frills'

var preseededCurInstr = null; // if you passed in a 'curInstr=<number>' in the URL, then set this var

var myVisualizer = null; // singleton ExecutionVisualizer instance

var VIZ_LABEL = "Run and Visualize Code";


var pyInputCodeMirror; // CodeMirror object that contains the solution code
var pyTestInputCodeMirror; // CodeMirror object that contains the test code


$(document).ready(function() {
  useCodeMirror = true; // set global defined in opt-frontend-common.js

  problemName = window.location.search;
  if (!problemName) {
    alert("Error! Pass in a valid problem name in the url as '?<problem name>'");
  }
  else {
    problemName = problemName.slice(1); // strip off '?'
  }


  $("#embedLinkDiv,#gradingPane,#pyOutputPane").hide();

  pyInputCodeMirror = CodeMirror(document.getElementById('codeInputPane'), {
    mode: 'python',
    lineNumbers: true,
    tabSize: 4,
    indentUnit: 4,
    // convert tab into four spaces:
    extraKeys: {Tab: function(cm) {cm.replaceSelection("    ", "end");}}
  });
  pyInputCodeMirror.setSize(null, '300px');

  pyTestInputCodeMirror = CodeMirror(document.getElementById('testInputPane'), {
    mode: 'python',
    lineNumbers: true,
    tabSize: 4,
    indentUnit: 4,
    // convert tab into four spaces:
    extraKeys: {Tab: function(cm) {cm.replaceSelection("    ", "end");}}
  });
  pyTestInputCodeMirror.setSize(null, '100px');


  // be friendly to the browser's forward and back buttons
  // thanks to http://benalman.com/projects/jquery-bbq-plugin/
  $(window).bind("hashchange", function(e) {
    appMode = $.bbq.getState('mode'); // assign this to the GLOBAL appMode

    if (appMode === undefined || appMode == 'edit') {
      $("#pyInputPane").show();
      $("#pyOutputPane,#gradingPane").hide();
      $("#embedLinkDiv").hide();

      // destroy all annotation bubbles (NB: kludgy)
      if (myVisualizer) {
        myVisualizer.destroyAllAnnotationBubbles();
      }
    }
    else if (appMode == 'display') {
      $("#pyInputPane").hide();
      $("#pyOutputPane,#gradingPane").show();
      $("#embedLinkDiv").show();

      $('#executeBtn').html(VIZ_LABEL);
      $('#executeBtn').attr('disabled', false);


      // do this AFTER making #pyOutputPane visible, or else
      // jsPlumb connectors won't render properly
      myVisualizer.updateOutput();

      // customize edit button click functionality AFTER rendering (NB: awkward!)
      $('#pyOutputPane #editCodeLinkDiv').show();
      $('#pyOutputPane #editBtn').click(function() {
        enterEditMode();
      });

      $('#gradeStdout').val(''); // clear 'em
      $('#submitGradeBtn').html('Submit for Grading');
      $('#submitGradeBtn').attr('disabled', false);
    }
    else if (appMode == 'display_no_frills') {
      $("#pyInputPane").hide();
      $("#pyOutputPane,#gradingPane").show();
      $("#embedLinkDiv").show();
    }
    else {
      assert(false);
    }

    $('#urlOutput,#embedCodeOutput').val(''); // clear to avoid stale values
  });


  function executeCode(inputCod, testCod) {
      backend_script = python3_backend_script;

      var allCod = inputCod + '\n\n# test code (ungraded)\n' + testCod;

      var nCodeLines = inputCod.split('\n').length + 2;

      $('#executeBtn').html("Please wait ... processing your code");
      $('#executeBtn').attr('disabled', true);
      $("#pyOutputPane,#gradingPane").hide();
      $("#embedLinkDiv").hide();

      var backendOptionsObj = {cumulative_mode: false,
                               heap_primitives: false,
                               show_only_outputs: false,
                               py_crazy_mode: false,
                               origin: originFrontendJsFile};

      var frontendOptionsObj = {updateOutputCallback: function() {$('#urlOutput,#embedCodeOutput').val('');},
                                compactFuncLabels: true,
                                jumpToEnd: true,
                               }

      function f1(errorLineNo) {
        pyInputCodeMirror.removeLineClass(errorLineNo, null, 'errorLine'); // reset line back to normal
        pyInputCodeMirror.off('change', f1);
      }
      function f2(errorLineNo) {
        pyTestInputCodeMirror.removeLineClass(errorLineNo, null, 'errorLine'); // reset line back to normal
        pyTestInputCodeMirror.off('change', f2);
      }

      function handleUncaughtExceptionFunc(trace) {
        if (trace.length == 1) {
          var errorLineNo = trace[0].line - 1; /* CodeMirror lines are zero-indexed */
          if (errorLineNo !== undefined) {
            if (errorLineNo < nCodeLines) {
              // highlight the faulting line in pyInputCodeMirror
              pyInputCodeMirror.focus();
              pyInputCodeMirror.setCursor(errorLineNo, 0);
              pyInputCodeMirror.addLineClass(errorLineNo, null, 'errorLine');
              pyInputCodeMirror.on('change', f1.bind(errorLineNo));
            }
            else {
              // instead highlight the faulting line in pyTestInputCodeMirror
              errorLineNo -= nCodeLines;

              pyTestInputCodeMirror.focus();
              pyTestInputCodeMirror.setCursor(errorLineNo, 0);
              pyTestInputCodeMirror.addLineClass(errorLineNo, null, 'errorLine');
              pyTestInputCodeMirror.on('change', f2.bind(errorLineNo));
            }
          }

          $('#executeBtn').html(VIZ_LABEL);
          $('#executeBtn').attr('disabled', false);
        }
      }

      executeCodeAndCreateViz(allCod,
                              backend_script, backendOptionsObj,
                              frontendOptionsObj,
                              'pyOutputPane',
                              enterDisplayMode, handleUncaughtExceptionFunc);
  }

  function executeCodeFromScratch() {
    var inputCod = pyInputCodeMirror.getValue();
    var testCod = pyTestInputCodeMirror.getValue();

    // don't execute empty string:
    if (($.trim(inputCod) == '') && ($.trim(testCod) == '')) {
      alert('Type in some code to visualize.');
      return;
    }

    executeCode(inputCod, testCod);
  }

  $("#executeBtn").attr('disabled', false);
  $("#executeBtn").click(executeCodeFromScratch);


  var queryStrOptions = getQueryStringOptions();

  appMode = queryStrOptions.appMode; // assign this to the GLOBAL appMode
  if ((appMode == "display") && queryStrOptions.preseededCode /* jump to display only with pre-seeded code */) {
    preseededCurInstr = queryStrOptions.preseededCurInstr; // ugly global
    $("#executeBtn").trigger('click');
  }
  else {
    if (appMode === undefined) {
      // default mode is 'edit', don't trigger a "hashchange" event
      appMode = 'edit';
    }
    else {
      // fail-soft by killing all passed-in hashes and triggering a "hashchange"
      // event, which will then go to 'edit' mode
      $.bbq.removeState();
    }
  }


  // log a generic AJAX error handler
  $(document).ajaxError(function() {
    alert("Server error (possibly due to memory/resource overload). " +
          "Report a bug to philip@pgbovine.net\n\n" +
          "(Click the 'Generate URL' button to include a unique URL in your email bug report.)");

    $('#executeBtn').html(VIZ_LABEL);
    $('#executeBtn').attr('disabled', false);
  });


  // redraw connector arrows on window resize
  $(window).resize(function() {
    if (appMode == 'display') {
      myVisualizer.redrawConnectors();
    }
  });

  if (problemName) {
    $.get('load_matrix_problem.py',
          {problem_name: problemName},
          function(dataFromBackend) {
            if (dataFromBackend.status == 'error') {
              alert("Error: " + problemName + " is not a valid problem name");
            }
            else {
              pyInputCodeMirror.setValue(dataFromBackend.code.rtrim());
              pyTestInputCodeMirror.setValue(dataFromBackend.test.rtrim());
              $(".problemDescClass").html(dataFromBackend.description);
            }
          },
          "json");

    $('#submitGradeBtn').bind('click', function() {
      $('#submitGradeBtn').html('Now Grading ...');
      $('#submitGradeBtn').attr('disabled', true);

      // some JSONP action!
      // http://learn.jquery.com/ajax/working-with-jsonp/
      $.ajax({
        url: "http://104.237.139.253:4000/grade",
        // The name of the callback parameter, as specified by the YQL service
        jsonp: "callback",
        // Tell jQuery we're expecting JSONP
        dataType: "jsonp",
        data: {submitted_code: pyInputCodeMirror.getValue(),
               problem_name: problemName},

        // Work with the response
        success: function(dataFromBackend) {
          if (dataFromBackend.err) {
            $('#gradeStdout').val(dataFromBackend.err);
          } else {
            if (dataFromBackend.user_stderr) {
              $('#gradeStdout').val(dataFromBackend.user_stdout + '\nErrors:\n' + dataFromBackend.user_stderr);
            } else {
              $('#gradeStdout').val(dataFromBackend.user_stdout);
            }

          }

          $('#submitGradeBtn').html('Submit for Grading');
          $('#submitGradeBtn').attr('disabled', false);
        },
      });
    });
  }
});
