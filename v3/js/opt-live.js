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
// first launched as a "Live Programming Mode" button on main OPT site
// on 2016-06-08, working for Python 2/3 and JavaScript for starters
//
// ... inspired by my explorations with IPython shell + OPT for REPL
// visualizations in August 2013 (opt-ipy.py), and Irene Chen's holistic
// visualizations (2013-2014 UROP), inspired by Bret Victor's stuff

/* TODOs:

- abstract out components within pytutor.js to prevent ugly code
  duplication with stuff in this file

- if these Ace enhancements look good, then I can also use them for
  Codeopticon as well!

- [later] add a codeopticon-style history slider of the user's past
  edits (but that might be confusing)

- [later] detect exact position of syntax error and put a squiggly line below
  it with something like:

  File "<string>", line 1
    x~=1
     ^

  (do this for the OPT classic editor too. and for other language backends)

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

var aceEditorWidth = '550px';
var disableRowScrolling = false; // really hacky global, ugh

var hasSyntaxError = false;
function toggleSyntaxError(x) {
  if (x) {
    hasSyntaxError = true;
    $("#dataViz,#curInstr").addClass('dimmed'); // dim the visualization until we fix the error
  } else {
    hasSyntaxError = false;
    $("#dataViz,#curInstr").removeClass('dimmed'); // un-dim the visualization
    var s = pyInputAceEditor.getSession();
    s.clearAnnotations(); // remove any lingering syntax error labels in gutter
  }
}

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

  $('#urlOutput').val(''); // prevent stale URLs

  var s = pyInputAceEditor.getSession();
  allMarkerIds.forEach(function(e) {
    s.removeMarker(e);
  });
  allMarkerIds = [];

  var totalInstrs = myVisualizer.curTrace.length;
  var isLastInstr = myVisualizer.curInstr === (totalInstrs-1);
  if (isLastInstr) {
    if (myVisualizer.promptForUserInput || myVisualizer.promptForMouseInput) {
      $("#curInstr").html('<b><font color="' + brightRed + '">Enter user input below:</font></b>');
    } else if (myVisualizer.instrLimitReached) {
      $("#curInstr").html("Instruction limit reached");
    } else {
      $("#curInstr").html("Done running (" + String(totalInstrs-1) + " steps)");
    }
  } else {
    $("#curInstr").html("Step " + String(myVisualizer.curInstr + 1) + " of " + String(totalInstrs-1));
  }

  // handle raw user input
  // copied from pytutor.js -- TODO: integrate this code better
  var ruiDiv = $('#rawUserInputDiv');
  if (isLastInstr && myVisualizer.executeCodeWithRawInputFunc &&
      myVisualizer.promptForUserInput) {
    ruiDiv.show();
    ruiDiv.find('#userInputPromptStr').html(myVisualizer.userInputPromptStr);
    ruiDiv.find('#raw_input_textbox').val('');

    // first UNBIND handler so that we don't build up multiple click events
    ruiDiv.find('#raw_input_submit_btn')
      .unbind('click')
      .click(function() {
        var userInput = ruiDiv.find('#raw_input_textbox').val();
        // advance instruction count by 1 to get to the NEXT instruction
        myVisualizer.executeCodeWithRawInputFunc(userInput, myVisualizer.curInstr + 1);
      });
  } else {
    ruiDiv.hide(); // hide by default
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

    if (myVisualizer.curLineNumber) {
      var Range = ace.require('ace/range').Range;
      var markerId = s.addMarker(new Range(myVisualizer.curLineNumber - 1, 0,
                                           myVisualizer.curLineNumber - 1, 1), "errorLine", "fullLine");
      allMarkerIds.push(markerId);
    }
  } else if (myVisualizer.instrLimitReached) {
    $("#frontendErrorOutput").html(htmlspecialchars(myVisualizer.instrLimitReachedWarningMsg));
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

  var lineToScrollTo = null;
  if (myVisualizer.curLineNumber) {
    lineToScrollTo = myVisualizer.curLineNumber;
  } else if (myVisualizer.prevLineNumber) {
    lineToScrollTo = myVisualizer.prevLineNumber;
  }

  // scroll the Ace editor to try to center the current line, but make
  // sure not to appear jarring, so apply some heuristics here
  // such as disableRowScrolling and checking to see if the current line
  // is visible
  if (lineToScrollTo && !disableRowScrolling) {
    var firstVisible = pyInputAceEditor.getFirstVisibleRow() + 1; // +1 to be more accurate
    var lastVisible = pyInputAceEditor.getLastVisibleRow();
    if (lineToScrollTo < firstVisible ||
        lineToScrollTo > lastVisible) {
      pyInputAceEditor.scrollToLine(lineToScrollTo, true /* try to center */);
    }
  }
}

function optliveFinishSuccessfulExecution() {
  assert(myVisualizer);
  $("#pyOutputPane,#vcrControls").show();
  doneExecutingCode();

  toggleSyntaxError(false);

  // set up execution slider, code inspired by pytutor.js:
  var sliderDiv = $('#executionSlider');
  sliderDiv.slider({min: 0, max: myVisualizer.curTrace.length - 1, step: 1});
  //disable keyboard actions on the slider itself (to prevent double-firing of events)
  sliderDiv.find(".ui-slider-handle").unbind('keydown');
  // make skinnier and taller
  sliderDiv.find(".ui-slider-handle").css('width', '0.8em');
  sliderDiv.find(".ui-slider-handle").css('height', '1.4em');
  $(".ui-widget-content").css('font-size', '0.9em');

  // unbind first to prevent multiple bindings
  sliderDiv.unbind('slide').bind('slide', function(evt, ui) {
    // this is SUPER subtle. if this value was changed programmatically,
    // then evt.originalEvent will be undefined. however, if this value
    // was changed by a user-initiated event, then this code should be
    // executed ...
    if (evt.originalEvent) {
      myVisualizer.renderStep(ui.value);
    }
    //updateStepLabels(); // I don't think we need this anymore
  });

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


  // initialize this at the VERY END after jumping to the proper initial step
  // above, perhaps using renderStep()

  // copied from opt-frontend-common.js
  myVisualizer.creationTime = new Date().getTime();
  // each element will be a two-element list consisting of:
  // [step number, timestamp]
  // (debounce entries that are less than 1 second apart to
  // compress the logs a bit when there's rapid scrubbing or scrolling)
  //
  // the first entry has a THIRD field:
  // [step number, timestamp, total # steps]
  //
  // subsequent entries don't need it since it will always be the same.
  // the invariant is that step number < total # steps (since it's
  // zero-indexed
  myVisualizer.updateHistory = [];
  myVisualizer.updateHistory.push([myVisualizer.curInstr,
                                   myVisualizer.creationTime,
                                   myVisualizer.curTrace.length]);

  // add this hook at the VERY END after jumping to the proper initial step
  // above, perhaps using renderStep()
  myVisualizer.add_pytutor_hook(
    "end_updateOutput",
    function(args) {
      // copied from opt-frontend-common.js
      if (args.myViz.creationTime) {
        var curTs = new Date().getTime();

        var uh = args.myViz.updateHistory;
        assert(uh.length > 0); // should already be seeded with an initial value
        if (uh.length > 1) { // don't try to "compress" the very first entry
          var lastTs = uh[uh.length - 1][1];
          // (debounce entries that are less than 1 second apart to
          // compress the logs a bit when there's rapid scrubbing or scrolling)
          if ((curTs - lastTs) < 1000) {
            uh.pop(); // get rid of last entry before pushing a new entry
          }
        }
        uh.push([args.myViz.curInstr, curTs]);
      }

      $('#executionSlider').slider('value', myVisualizer.curInstr); // update slider
      updateStepLabels();

      return [false];
    }
  );

  $('#executionSlider').slider('value', myVisualizer.curInstr); // update slider
}

// a syntax-/compile-time error, rather than a runtime error
function optliveHandleUncaughtExceptionFunc(trace) {
  if (trace.length == 1 && trace[0].line) {
    var errorLineNo = trace[0].line - 1; /* CodeMirror lines are zero-indexed */
    if (errorLineNo !== undefined && errorLineNo != NaN) {
      removeAllGutterDecorations();

      if (myVisualizer) {
        toggleSyntaxError(true);
        myVisualizer.redrawConnectors();
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

  $("#pyInputPane,#codeInputPane")
    .css('width', aceEditorWidth)
    .css('min-width', '250px')
    .css('max-width', '700px'); // don't let it get too ridiculously wide
  $('#codeInputPane').css('height', height + 'px'); // VERY IMPORTANT so that it works on I.E., ugh!

  // make it resizable!
  $("#codeInputPane").resizable({
    resize: function(evt, ui) {
      pyInputAceEditor.resize(); // to keep Ace internals happy
      $("#pyInputPane").width($("#codeInputPane").width()); // to keep parent happy
      if (myVisualizer) {
        myVisualizer.redrawConnectors(); // to keep visualizations happy
      }
    }
  });

  pyInputAceEditor.on('change', function(e) {
    $.doTimeout('pyInputAceEditorChange',
                500, /* go a bit faster than CODE_SNAPSHOT_DEBOUNCE_MS to feel more snappy */
                //CODE_SNAPSHOT_DEBOUNCE_MS /* match the value in opt-frontend-common.js for consistency and easy apples-to-apples comparisons later on */,
                optliveExecuteCodeFromScratch); // debounce
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

      // run this all at the VERY END after all the dust has settled
      doneExecutingCode(); // rain or shine, we're done executing!
      disableRowScrolling = false;
    }

    clearFrontendError();
    startExecutingCode();

    setFronendError(['Running your code ...']);

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

    // submit update history of the "previous" visualizer whenever you
    // run the code and hopefully get a new visualizer back
    //
    // don't bother if we're currently on a syntax error since the
    // displayed visualization is no longer relevant
    var prevUpdateHistoryJSON = undefined;
    if (hasSyntaxError) {
      prevUpdateHistoryJSON = 'hasSyntaxError'; // hacky
    } else if (myVisualizer) {
      var encodedUh = compressUpdateHistoryList(myVisualizer);
      prevUpdateHistoryJSON = JSON.stringify(encodedUh);
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
             session_uuid: sessionUUID,
             prevUpdateHistoryJSON: prevUpdateHistoryJSON,
             exeTime: new Date().getTime()},
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
             session_uuid: sessionUUID,
             prevUpdateHistoryJSON: prevUpdateHistoryJSON,
             exeTime: new Date().getTime()},
             execCallback, "json");
    }
}

// overrides the version in opt-frontend.js
function executeCode(forceStartingInstr, forceRawInputLst) {
    $('#urlOutput').val(''); // clear to avoid stale values

    var cod = pyInputGetValue();
    // don't run empty code
    if ($.trim(cod) === '') {
      return;
    }

    if (forceRawInputLst !== undefined) {
        rawInputLst = forceRawInputLst; // UGLY global across modules, FIXME
    }

    var backend_script = langToBackendScript($('#pythonVersionSelector').val());

    var backendOptionsObj = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
                             heap_primitives: ($('#heapPrimitivesSelector').val() == 'true'),
                             show_only_outputs: false,
                             py_crazy_mode: false,
                             origin: originFrontendJsFile};

    var startingInstruction = forceStartingInstr ? forceStartingInstr : 0;
    var frontendOptionsObj = {startingInstruction: startingInstruction,
                              executeCodeWithRawInputFunc: executeCodeWithRawInput,
                              // tricky tricky
                              disableHeapNesting: ($('#heapPrimitivesSelector').val() == 'true'),
                              textualMemoryLabels: ($('#textualMemoryLabelsSelector').val() == 'true'),
                              hideCode: true,
                              jumpToEnd: true,
                             }

    optliveExecuteCodeAndCreateViz(cod,
                            backend_script, backendOptionsObj,
                            frontendOptionsObj,
                            'pyOutputPane',
                            optliveFinishSuccessfulExecution,
                            optliveHandleUncaughtExceptionFunc);
}

// see getAppState to see where it calls out to this function:
function appStateAugmenter(appState) {
  appState.mode = 'display'; // super hack so that when you generate URLs, it will say 'display' mode
}

function optliveExecuteCodeFromScratch() {
  disableRowScrolling = true; // annoying hacky global
  executeCodeFromScratch();
}

$(document).ready(function() {
  genericOptFrontendReady();

  $('#legendDiv')
    .append('<svg id="prevLegendArrowSVG"/> line that has just executed')
    .append('<p style="margin-top: 4px"><svg id="curLegendArrowSVG"/> next line to execute</p>');

  d3.select('svg#prevLegendArrowSVG')
      .append('polygon')
      .attr('points', SVG_ARROW_POLYGON)
      .attr('fill', lightArrowColor);

  d3.select('svg#curLegendArrowSVG')
      .append('polygon')
      .attr('points', SVG_ARROW_POLYGON)
      .attr('fill', darkArrowColor);

  $('#cumulativeModeSelector,#heapPrimitivesSelector,#textualMemoryLabelsSelector,#pythonVersionSelector').change(function() {
    setAceMode();
    // force a re-execute on a toggle switch
    optliveExecuteCodeFromScratch();
  });

  setAceMode(); // set syntax highlighting at the end
  $("#pyOutputPane").show();


  $("#jmpFirstInstr").click(function() {
    if (myVisualizer) {myVisualizer.renderStep(0);}
  });

  $("#jmpLastInstr").click(function() {
    if (myVisualizer) {myVisualizer.renderStep(myVisualizer.curTrace.length - 1);}
  });

  $("#jmpStepBack").click(function() {
    if (myVisualizer) {myVisualizer.stepBack();}
  });

  $("#jmpStepFwd").click(function() {
    if (myVisualizer) {myVisualizer.stepForward();}
  });
});
