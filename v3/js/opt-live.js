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

// OPT live programming prototype started on 2016-05-30
// ... inspired by my explorations with IPython shell + OPT for REPL
// visualizations in August 2013 (opt-ipy.py), and Irene Chen's holistic
// visualizations (2013-2014 UROP), inspired by Bret Victor's stuff

/* TODOs:

- detect exact position of syntax error and put a squiggly line below it
  with something like:

  File "<string>", line 1
    x~=1
     ^

- [later] add a codeopticon-style history slider of the user's past
  edits

- slightly gray out the visualization when there's a syntax error, to
  indicate to user that it's not indicative of the current code

- display run-time exceptions properly -- right now display-mode code is
  hidden, so no exceptions displayed either

- also display stdout too

*/

// Pre-reqs:
// - pytutor.js
// - jquery.ba-bbq.min.js
// - jquery.ba-dotimeout.min.js // for event debouncing: http://benalman.com/code/projects/jquery-dotimeout/examples/debouncing/
// - opt-frontend-common.js
// should all be imported BEFORE this file

var originFrontendJsFile = 'opt-live.js';


function updateSliderLabels() {
  assert(myVisualizer);
  var totalInstrs = myVisualizer.curTrace.length;
  var isLastInstr = myVisualizer.curInstr == (totalInstrs-1);
  if (isLastInstr) {
    if (myVisualizer.promptForUserInput || myVisualizer.promptForMouseInput) {
      $("#curInstr").html('<b><font color="' + brightRed + '">Enter user input:</font></b>');
    } else if (myVisualizer.instrLimitReached) {
      $("#curInstr").html("Instruction limit reached");
    } else {
      $("#curInstr").html("Program terminated");
    }
  } else {
    $("#curInstr").html("Step " + String(myVisualizer.curInstr + 1) + " of " + String(totalInstrs-1));
  }

  // render error (if applicable):
  var curEntry = myVisualizer.curTrace[myVisualizer.curInstr];
  if (curEntry.event == 'exception' ||
      curEntry.event == 'uncaught_exception') {
    assert(curEntry.exception_msg);
    if (curEntry.exception_msg == "Unknown error") {
      $("#frontendErrorOutput").html('Unknown error: Please email a bug report to philip@pgbovine.net');
    } else {
      $("#frontendErrorOutput").html(htmlspecialchars(curEntry.exception_msg));
    }
    $("#frontendErrorOutput").show();
  }
}


function optliveFinishSuccessfulExecution() {
  assert(myVisualizer);
  $("#pyOutputPane").show();
  doneExecutingCode();

  // set up execution slider, code inspired by pytutor.js:
  var sliderDiv = $('#executionSlider');
  sliderDiv.slider({min: 0, max: myVisualizer.curTrace.length - 1, step: 1});
  //disable keyboard actions on the slider itself (to prevent double-firing of events)
  sliderDiv.find(".ui-slider-handle").unbind('keydown');
  // make skinnier and taller
  sliderDiv.find(".ui-slider-handle").css('width', '0.8em');
  sliderDiv.find(".ui-slider-handle").css('height', '1.4em');
  $(".ui-widget-content").css('font-size', '0.9em');

  sliderDiv.bind('slide', function(evt, ui) {
    // this is SUPER subtle. if this value was changed programmatically,
    // then evt.originalEvent will be undefined. however, if this value
    // was changed by a user-initiated event, then this code should be
    // executed ...
    if (evt.originalEvent) {
      myVisualizer.renderStep(ui.value);
      updateSliderLabels();
    }
  });

  myVisualizer.add_pytutor_hook(
    "end_updateOutput",
    function(args) {
      // PROGRAMMATICALLY change the value, so evt.originalEvent should be undefined
      $('#executionSlider').slider('value', args.myViz.curInstr);
      updateSliderLabels();
      return [false];
    }
  );

  // do this AFTER making #pyOutputPane visible, or else
  // jsPlumb connectors won't render properly
  myVisualizer.updateOutput();
}

function optliveHandleUncaughtExceptionFunc(trace) {
  if (trace.length == 1 && trace[0].line) {
    var errorLineNo = trace[0].line - 1; /* CodeMirror lines are zero-indexed */
    if (errorLineNo !== undefined && errorLineNo != NaN) {
      var s = pyInputAceEditor.getSession();
      s.setAnnotations([{row: errorLineNo,
                         type: 'error',
                         text: trace[0].exception_msg}]);
    }
  }
}

// override the one in opt-frontend-common.js
function initAceEditor(height) {
  pyInputAceEditor = ace.edit('codeInputPane');

  var s = pyInputAceEditor.getSession();
  s.setMode("ace/mode/python");
  // tab -> 4 spaces
  s.setTabSize(4);
  s.setUseSoftTabs(true);

  // disable extraneous indicators:
  s.setFoldStyle('manual'); // no code folding indicators
  s.getDocument().setNewLineMode('unix'); // canonicalize all newlines to unix format
  pyInputAceEditor.setHighlightActiveLine(false);
  pyInputAceEditor.setShowPrintMargin(false);
  pyInputAceEditor.setBehavioursEnabled(false);
  pyInputAceEditor.$blockScrolling = Infinity; // kludgy to shut up weird warnings

  // auto-grow height as fit
  pyInputAceEditor.setOptions({minLines: 18, maxLines: 1000});

  $('#codeInputPane').css('width', '450px');
  $('#codeInputPane').css('height', height + 'px'); // VERY IMPORTANT so that it works on I.E., ugh!

  pyInputAceEditor.on('change', function(e) {
    $.doTimeout('pyInputAceEditorChange', 500, function() {
      // don't execute empty string:
      if ($.trim(pyInputGetValue()) === '') {
        return;
      }
      executeCode();
    }); // debounce
    clearFrontendError();
    s.clearAnnotations();
  });

  // don't do real-time syntax checks:
  // https://github.com/ajaxorg/ace/wiki/Syntax-validation
  s.setOption("useWorker", false);
  pyInputAceEditor.focus();
}

// based on executeCodeAndCreateViz
function optliveExecuteCodeAndCreateViz(codeToExec,
                                 backendScript, backendOptionsObj,
                                 frontendOptionsObj,
                                 outputDiv,
                                 handleSuccessFunc, handleUncaughtExceptionFunc) {

    function execCallback(dataFromBackend) {
      var trace = dataFromBackend.trace;

      // don't enter visualize mode if there are killer errors:
      if (!trace ||
          (trace.length == 0) ||
          (trace[trace.length - 1].event == 'uncaught_exception')) {

        handleUncaughtExceptionFunc(trace);

        if (trace.length == 1) {
          setFronendError([trace[0].exception_msg]);
        }
        else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
          setFronendError([trace[trace.length - 1].exception_msg]);
        }
        else {
          setFronendError(["Unknown error. Reload the page and try again. Or report a bug to",
                           "philip@pgbovine.net by clicking on the 'Generate permanent link'",
                           "button at the bottom and including a URL in your email."]);
        }
      }
      else {
        myVisualizer = new ExecutionVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);
        handleSuccessFunc();
      }

      doneExecutingCode(); // rain or shine, we're done executing!
      // run this at the VERY END after all the dust has settled
    }

    clearFrontendError();
    startExecutingCode();

    if (backendScript === python2_backend_script) {
      frontendOptionsObj.lang = 'py2';
    } else if (backendScript === python3_backend_script) {
      frontendOptionsObj.lang = 'py3';
    } else {
      assert(false);
    }

    $.get(backendScript,
          {user_script : codeToExec,
           raw_input_json: rawInputLst.length > 0 ? JSON.stringify(rawInputLst) : '',
           options_json: JSON.stringify(backendOptionsObj),
           user_uuid: supports_html5_storage() ? localStorage.getItem('opt_uuid') : undefined,
           session_uuid: sessionUUID},
           execCallback, "json");
}

function executeCode(forceStartingInstr, forceRawInputLst) {
    if (forceRawInputLst !== undefined) {
        rawInputLst = forceRawInputLst; // UGLY global across modules, FIXME
    }

    backend_script = python2_backend_script;

    var backendOptionsObj = {cumulative_mode: false,
                             heap_primitives: false,
                             show_only_outputs: false,
                             py_crazy_mode: false,
                             origin: originFrontendJsFile};

    var startingInstruction = forceStartingInstr ? forceStartingInstr : 0;
    var frontendOptionsObj = {startingInstruction: startingInstruction,
                              executeCodeWithRawInputFunc: executeCodeWithRawInput,
                              updateOutputCallback: function() {$('#urlOutput,#embedCodeOutput').val('');},
                              hideCode: true,
                              jumpToEnd: true,
                             }

    optliveExecuteCodeAndCreateViz(pyInputGetValue(),
                            backend_script, backendOptionsObj,
                            frontendOptionsObj,
                            'pyOutputPane',
                            optliveFinishSuccessfulExecution,
                            optliveHandleUncaughtExceptionFunc);
}

$(document).ready(function() {
  genericOptFrontendReady(); // initialize at the very end
  $("#pyOutputPane").show();
});
