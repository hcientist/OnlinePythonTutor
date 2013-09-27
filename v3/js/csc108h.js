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


// simplified version of opt-frontend.js for ../csc108h.html
// for Paul Gries and Jennifer Campbell at Toronto


// Pre-reqs:
// - pytutor.js
// - jquery.ba-bbq.min.js
// - opt-frontend-common.js
// should all be imported BEFORE this file


var appMode = 'edit'; // 'edit', 'display', or 'display_no_frills'

var preseededCurInstr = null; // if you passed in a 'curInstr=<number>' in the URL, then set this var

var myVisualizer = null; // singleton ExecutionVisualizer instance


function enterEditMode() {
  $.bbq.pushState({ mode: 'edit' }, 2 /* completely override other hash strings to keep URL clean */);
}

function enterDisplayNoFrillsMode() {
  $.bbq.pushState({ mode: 'display_no_frills' }, 2 /* completely override other hash strings to keep URL clean */);
}

var pyInputCodeMirror; // CodeMirror object that contains the input text

function setCodeMirrorVal(dat) {
  pyInputCodeMirror.setValue(dat.rtrim() /* kill trailing spaces */);
  $('#urlOutput,#embedCodeOutput').val('');

  // also scroll to top to make the UI more usable on smaller monitors
  $(document).scrollTop(0);
}


$(document).ready(function() {

  $("#embedLinkDiv").hide();

  pyInputCodeMirror = CodeMirror(document.getElementById('codeInputPane'), {
    mode: 'python',
    lineNumbers: true,
    tabSize: 4,
    indentUnit: 4,
    // convert tab into four spaces:
    extraKeys: {Tab: function(cm) {cm.replaceSelection("    ", "end");}}
  });

  pyInputCodeMirror.setSize(null, '420px');



  // be friendly to the browser's forward and back buttons
  // thanks to http://benalman.com/projects/jquery-bbq-plugin/
  $(window).bind("hashchange", function(e) {
    appMode = $.bbq.getState('mode'); // assign this to the GLOBAL appMode

    if (appMode === undefined || appMode == 'edit') {
      $("#pyInputPane").show();
      $("#pyOutputPane").hide();
      $("#embedLinkDiv").hide();

      // destroy all annotation bubbles (NB: kludgy)
      if (myVisualizer) {
        myVisualizer.destroyAllAnnotationBubbles();
      }
    }
    else if (appMode == 'display') {
      $("#pyInputPane").hide();
      $("#pyOutputPane").show();

      $("#embedLinkDiv").show();

      $('#executeBtn').html("Visualize Execution");
      $('#executeBtn').attr('disabled', false);


      // do this AFTER making #pyOutputPane visible, or else
      // jsPlumb connectors won't render properly
      myVisualizer.updateOutput();

      // customize edit button click functionality AFTER rendering (NB: awkward!)
      $('#pyOutputPane #editCodeLinkDiv').show();
      $('#pyOutputPane #editBtn').click(function() {
        enterEditMode();
      });
    }
    else if (appMode == 'display_no_frills') {
      $("#pyInputPane").hide();
      $("#pyOutputPane").show();
      $("#embedLinkDiv").show();
    }
    else {
      assert(false);
    }

    $('#urlOutput,#embedCodeOutput').val(''); // clear to avoid stale values
  });


  function executeCode(forceStartingInstr) {
      backend_script = python3_backend_script; // Python 3.3

      $('#executeBtn').html("Please wait ... processing your code");
      $('#executeBtn').attr('disabled', true);
      $("#pyOutputPane").hide();
      $("#embedLinkDiv").hide();

      var backendOptionsObj = {cumulative_mode: false,
                               heap_primitives: true, // render all objects on the heap
                               show_only_outputs: false,
                               py_crazy_mode: false,
                               origin: 'csc108h.js'};

      var startingInstruction = 0;

      // only do this at most ONCE, and then clear out preseededCurInstr
      // NOP anyways if preseededCurInstr is 0
      if (preseededCurInstr) {
        startingInstruction = preseededCurInstr;
        preseededCurInstr = null;
      }

      // forceStartingInstr overrides everything else
      if (forceStartingInstr !== undefined) {
        startingInstruction = forceStartingInstr;
      }

      var frontendOptionsObj = {startingInstruction: startingInstruction,
                                executeCodeWithRawInputFunc: executeCodeWithRawInput,
                                disableHeapNesting: true, // render all objects on the heap
                                drawParentPointers: true, // show environment parent pointers
                                textualMemoryLabels: true, // use text labels for references
                                updateOutputCallback: function() {$('#urlOutput,#embedCodeOutput').val('');},
                               }

      function handleSuccessFunc() {
        // also scroll to top to make the UI more usable on smaller monitors
        $(document).scrollTop(0);

        $.bbq.pushState({ mode: 'display' }, 2 /* completely override other hash strings to keep URL clean */);
      }

      function handleUncaughtExceptionFunc(trace) {
        if (trace.length == 1) {
          var errorLineNo = trace[0].line - 1; /* CodeMirror lines are zero-indexed */
          if (errorLineNo !== undefined) {
            // highlight the faulting line in pyInputCodeMirror
            pyInputCodeMirror.focus();
            pyInputCodeMirror.setCursor(errorLineNo, 0);
            pyInputCodeMirror.setLineClass(errorLineNo, null, 'errorLine');

            pyInputCodeMirror.setOption('onChange', function() {
              pyInputCodeMirror.setLineClass(errorLineNo, null, null); // reset line back to normal
              pyInputCodeMirror.setOption('onChange', null); // cancel
            });
          }

          $('#executeBtn').html("Visualize Execution");
          $('#executeBtn').attr('disabled', false);
        }
      }

      executePythonCode(pyInputCodeMirror.getValue(),
                        backend_script, backendOptionsObj,
                        frontendOptionsObj,
                        'pyOutputPane',
                        handleSuccessFunc, handleUncaughtExceptionFunc);
  }

  function executeCodeFromScratch() {
    // don't execute empty string:
    if ($.trim(pyInputCodeMirror.getValue()) == '') {
      alert('Type in some code to visualize.');
      return;
    }

    // reset these globals
    rawInputLst = [];
    executeCode();
  }

  function executeCodeWithRawInput(rawInputStr, curInstr) {
    enterDisplayNoFrillsMode();

    // set some globals
    rawInputLst.push(rawInputStr);
    executeCode(curInstr);
  }

  $("#executeBtn").attr('disabled', false);
  $("#executeBtn").click(executeCodeFromScratch);


  var queryStrOptions = getQueryStringOptions();

  if (queryStrOptions.preseededCode) {
    setCodeMirrorVal(queryStrOptions.preseededCode);
  }
  else {
    // select a canned example on start-up:
    $("#aliasExampleLink").trigger('click');
  }

  // ugh, ugly tristate due to the possibility of each being undefined
  if (queryStrOptions.cumulativeState !== undefined) {
    $('#cumulativeModeSelector').val(queryStrOptions.cumulativeState);
  }

  appMode = $.bbq.getState('mode'); // assign this to the GLOBAL appMode
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

    $('#executeBtn').html("Visualize Execution");
    $('#executeBtn').attr('disabled', false);
  });


  // redraw connector arrows on window resize
  $(window).resize(function() {
    if (appMode == 'display') {
      myVisualizer.redrawConnectors();
    }
  });

  $('#genUrlBtn').bind('click', function() {
    var myArgs = {code: pyInputCodeMirror.getValue(),
                  mode: appMode,
                  cumulative: $('#cumulativeModeSelector').val(),
                  py: $('#pythonVersionSelector').val()};

    if (appMode == 'display') {
      myArgs.curInstr = myVisualizer.curInstr;
    }

    var urlStr = $.param.fragment(window.location.href, myArgs, 2 /* clobber all */);
    $('#urlOutput').val(urlStr);
  });
});

