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

- [later] detect exact position of syntax error and put a squiggly line below
  it with something like:

  File "<string>", line 1
    x~=1
     ^
- for slower frontends, add an unobtrusive "running ..." indicator

- make Ace editor resizable width-wise using jQuery resizable
  (stackoverflow has some tips for how to do that)

- support pasting in code via URL, which will be important for
  transporting the user from regular OPT to live mode

- make sure server logging works properly, esp. session and user IDs,
  and slider interactions

- add "Generate permanent link" button, but no need for iframe embed btn

- if these Ace enhancements look good, then I can also use them for
  Codeopticon as well!

- [later] add a codeopticon-style history slider of the user's past
  edits (but that might be confusing)

*/


// Pre-reqs:
// - pytutor.js
// - jquery.ba-bbq.min.js
// - jquery.ba-dotimeout.min.js // for event debouncing: http://benalman.com/code/projects/jquery-dotimeout/examples/debouncing/
// - opt-frontend-common.js
// should all be imported BEFORE this file


// these scripts override the versions defined in opt-frontend-common.js

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
//var python2_backend_script = 'LIVE_exec_py2.py';
//var python3_backend_script = 'LIVE_exec_py3.py';

// uncomment below if you're running on Google App Engine using the built-in app.yaml
var python2_backend_script = 'exec';
var python3_backend_script = 'exec';

// empty dummy just to do logging on the Apache's server
var js_backend_script = 'LIVE_exec_js.py';
var ts_backend_script = 'LIVE_exec_ts.py';
var java_backend_script = 'LIVE_exec_java.py';
var ruby_backend_script = 'LIVE_exec_ruby.py';
var c_backend_script = 'LIVE_exec_c.py';
var cpp_backend_script = 'LIVE_exec_cpp.py';


var originFrontendJsFile = 'opt-live.js';

var prevVisualizer = null; // the visualizer object from the previous execution

var aceEditorWidth = '600px';

var allMarkerIds = [];

function removeAllGutterDecorations() {
  var s = pyInputAceEditor.getSession();
  var d = s.getDocument();

  for (var i = 0; i < d.getLength(); i++) {
    s.removeGutterDecoration(i, 'curLineStepGutter');
    s.removeGutterDecoration(i, 'prevLineStepGutter');
    s.removeGutterDecoration(i, 'curPrevOverlapLineStepGutter');
  }
}

function updateStepLabels() {
  assert(myVisualizer);
  myVisualizer.updateCurPrevLines(); // do this first to update the right fields

  var s = pyInputAceEditor.getSession();
  allMarkerIds.forEach(function(e) {
    s.removeMarker(e);
  });
  allMarkerIds = [];

  var totalInstrs = myVisualizer.curTrace.length;
  var isLastInstr = myVisualizer.curInstr === (totalInstrs-1);
  if (isLastInstr) {
    if (myVisualizer.promptForUserInput || myVisualizer.promptForMouseInput) {
      $("#curInstr").html('<b><font color="' + brightRed + '">Enter user input:</font></b>');
    } else if (myVisualizer.instrLimitReached) {
      $("#curInstr").html("Instruction limit reached (" + String(totalInstrs-1) + " steps)");
    } else {
      $("#curInstr").html("Program terminated (" + String(totalInstrs-1) + " steps)");
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

    if (myVisualizer.curLineNumber) {
      var Range = ace.require('ace/range').Range;
      var markerId = s.addMarker(new Range(myVisualizer.curLineNumber - 1, 0,
                                           myVisualizer.curLineNumber - 1, 1), "errorLine", "fullLine");
      allMarkerIds.push(markerId);
    }
  } else {
    $("#frontendErrorOutput").html(''); // clear it
  }

  removeAllGutterDecorations();

  // special case if both arrows overlap
  if ( myVisualizer.curLineNumber &&
      (myVisualizer.curLineNumber === myVisualizer.prevLineNumber)) {
    s.addGutterDecoration(myVisualizer.curLineNumber-1,
                          'curPrevOverlapLineStepGutter');
  } else {
    // render separately
    if (myVisualizer.curLineNumber) {
      s.addGutterDecoration(myVisualizer.curLineNumber-1, 'curLineStepGutter');
    }
    if (myVisualizer.prevLineNumber) {
      s.addGutterDecoration(myVisualizer.prevLineNumber-1, 'prevLineStepGutter');
    }
  }
}

function optliveFinishSuccessfulExecution() {
  assert(myVisualizer);
  $("#pyOutputPane").show();
  doneExecutingCode();

  $("#dataViz,#curInstr").removeClass('dimmed'); // un-dim the visualization

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
      updateStepLabels();
    }
  });

  myVisualizer.add_pytutor_hook(
    "end_updateOutput",
    function(args) {
      // PROGRAMMATICALLY change the value, so evt.originalEvent should be undefined
      $('#executionSlider').slider('value', args.myViz.curInstr);
      return [false];
    }
  );

  // do this AFTER making #pyOutputPane visible, or else
  // jsPlumb connectors won't render properly

  // try to "match" the same position as the previous visualizer so that
  // the display isn't jerky
  if (prevVisualizer) {
    var prevVizInstr = prevVisualizer.curInstr;
    var prevVizIsFinalInstr = (prevVisualizer.curInstr === (prevVisualizer.curTrace.length-1));

    // match the previous step if it we weren't on the last one, and the new
    // trace is at least as long
    if (!prevVizIsFinalInstr &&
        (myVisualizer.curTrace.length >= prevVisualizer.curTrace.length)) {
      myVisualizer.renderStep(prevVizInstr);
    } else {
      myVisualizer.updateOutput();
    }
  } else {
    myVisualizer.updateOutput();
  }

  updateStepLabels(); // do it once
}

function optliveHandleUncaughtExceptionFunc(trace) {
  if (trace.length == 1 && trace[0].line) {
    var errorLineNo = trace[0].line - 1; /* CodeMirror lines are zero-indexed */
    if (errorLineNo !== undefined && errorLineNo != NaN) {
      removeAllGutterDecorations();

      if (myVisualizer) {
        $("#dataViz,#curInstr").addClass('dimmed'); // dim the visualization until we fix the error
        myVisualizer.updateOutput(); // to update arrows
      }

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

  // disable extraneous indicators:
  s.setFoldStyle('manual'); // no code folding indicators
  s.getDocument().setNewLineMode('unix'); // canonicalize all newlines to unix format
  pyInputAceEditor.setHighlightActiveLine(false);
  pyInputAceEditor.setShowPrintMargin(false);
  pyInputAceEditor.setBehavioursEnabled(false);

  pyInputAceEditor.setHighlightGutterLine(false); // to avoid gray highlight over gutter of active line
  pyInputAceEditor.setDisplayIndentGuides(false); // to avoid annoying gray vertical lines

  pyInputAceEditor.$blockScrolling = Infinity; // kludgy to shut up weird warnings

  // auto-grow height as fit
  pyInputAceEditor.setOptions({minLines: 20, maxLines: 20});

  $("#pyInputPane,#codeInputPane").css('width', aceEditorWidth);
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

  // custom gutter renderer, make it wider to accomodate arrows on left
  // http://stackoverflow.com/a/28404331
  s.gutterRenderer = {
    getWidth: function(session, lastLineNumber, config) {
      return (lastLineNumber.toString().length * config.characterWidth) + 6;
    },
    getText: function(session, row) {
      return (row+1);
    }
  };
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
        prevVisualizer = myVisualizer;
        myVisualizer = new ExecutionVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);
        handleSuccessFunc();
      }

      doneExecutingCode(); // rain or shine, we're done executing!
      // run this at the VERY END after all the dust has settled
    }

    clearFrontendError();
    startExecutingCode();

    jsonp_endpoint = null;

    // hacky!
    if (backendScript === python2_backend_script) {
      frontendOptionsObj.lang = 'py2';
    } else if (backendScript === python3_backend_script) {
      frontendOptionsObj.lang = 'py3';
    } else if (backendScript === js_backend_script) {
      frontendOptionsObj.lang = 'js';
      jsonp_endpoint = JS_JSONP_ENDPOINT;
    } else if (backendScript === ts_backend_script) {
      frontendOptionsObj.lang = 'ts';
      jsonp_endpoint = TS_JSONP_ENDPOINT;
    } else if (backendScript === ruby_backend_script) {
      frontendOptionsObj.lang = 'ruby';
      jsonp_endpoint = RUBY_JSONP_ENDPOINT;
    } else if (backendScript === java_backend_script) {
      frontendOptionsObj.lang = 'java';
      frontendOptionsObj.disableHeapNesting = true; // never nest Java objects, seems like a good default
      jsonp_endpoint = JAVA_JSONP_ENDPOINT;
    } else if (backendScript === c_backend_script) {
      frontendOptionsObj.lang = 'c';
      jsonp_endpoint = C_JSONP_ENDPOINT;
    } else if (backendScript === cpp_backend_script) {
      frontendOptionsObj.lang = 'cpp';
      jsonp_endpoint = CPP_JSONP_ENDPOINT;
    } else {
      assert(false);
    }

    if (backendScript === js_backend_script ||
        backendScript === ts_backend_script ||
        backendScript === java_backend_script ||
        backendScript === ruby_backend_script ||
        backendScript === c_backend_script ||
        backendScript === cpp_backend_script) {
      // hack! should just be a dummy script for logging only
      $.get(backendScript,
            {user_script : codeToExec,
             options_json: JSON.stringify(backendOptionsObj),
             user_uuid: supports_html5_storage() ? localStorage.getItem('opt_uuid') : undefined,
             session_uuid: sessionUUID},
             function(dat) {} /* don't do anything since this is a dummy call */, "text");

      // the REAL call uses JSONP
      // http://learn.jquery.com/ajax/working-with-jsonp/
      assert(jsonp_endpoint);
      $.ajax({
        url: jsonp_endpoint,
        // The name of the callback parameter, as specified by the YQL service
        jsonp: "callback",
        dataType: "jsonp",
        data: {user_script : codeToExec,
               options_json: JSON.stringify(backendOptionsObj)},
        success: execCallback,
      });
    } else {
      // Python 2 or 3
      $.get(backendScript,
            {user_script : codeToExec,
             raw_input_json: rawInputLst.length > 0 ? JSON.stringify(rawInputLst) : '',
             options_json: JSON.stringify(backendOptionsObj),
             user_uuid: supports_html5_storage() ? localStorage.getItem('opt_uuid') : undefined,
             session_uuid: sessionUUID},
             execCallback, "json");
    }
}

function executeCode(forceStartingInstr, forceRawInputLst) {
    if (forceRawInputLst !== undefined) {
        rawInputLst = forceRawInputLst; // UGLY global across modules, FIXME
    }

    var backend_script = langToBackendScript($('#pythonVersionSelector').val());

    var backendOptionsObj = {cumulative_mode: false,
                             heap_primitives: false,
                             show_only_outputs: false,
                             py_crazy_mode: false,
                             origin: originFrontendJsFile};

    var startingInstruction = forceStartingInstr ? forceStartingInstr : 0;
    var frontendOptionsObj = {startingInstruction: startingInstruction,
                              executeCodeWithRawInputFunc: executeCodeWithRawInput,
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
  genericOptFrontendReady();

  $('#pythonVersionSelector').change(function() {
    setAceMode();
    // force a recompile on a toggle switch
    executeCode();
  });

  setAceMode(); // set syntax highlighting at the end
  $("#pyOutputPane").show();
});
