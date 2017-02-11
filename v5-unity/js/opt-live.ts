// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt


// OPT live programming prototype started on 2016-05-30
// first launched as a "Live Programming Mode" button on main OPT site
// on 2016-06-08, working for Python 2/3 and JavaScript for starters
//
// ... inspired by my explorations with IPython shell + OPT for REPL
// visualizations in August 2013 (opt-ipy.py), and Irene Chen's holistic
// visualizations (2013-2014 UROP), inspired by Bret Victor's stuff

/* TODOs:

- get shared sessions working here after refactoring ... it kinda almost
  works right now

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

require('../css/opt-frontend.css');
require('../css/opt-live.css');

// need to directly import the class for type checking to work
import {OptFrontend} from './opt-frontend';
import {ExecutionVisualizer, assert, brightRed, darkArrowColor, lightArrowColor, SVG_ARROW_POLYGON, htmlspecialchars} from './pytutor';

// just punt and use global script dependencies
require("script-loader!./lib/ace/src-min-noconflict/ace.js");
require('script-loader!./lib/ace/src-min-noconflict/mode-python.js');
require('script-loader!./lib/ace/src-min-noconflict/mode-javascript.js');
require('script-loader!./lib/ace/src-min-noconflict/mode-typescript.js');
require('script-loader!./lib/ace/src-min-noconflict/mode-c_cpp.js');
require('script-loader!./lib/ace/src-min-noconflict/mode-java.js');
require('script-loader!./lib/ace/src-min-noconflict/mode-ruby.js');


var optLiveFrontend: OptLiveFrontend;


export class OptLiveFrontend extends OptFrontend {
  originFrontendJsFile: string = 'opt-live.js';

  prevVisualizer = null; // the visualizer object from the previous execution
  disableRowScrolling = false;
  hasSyntaxError = false;

  allMarkerIds: number[] = [];

  // override
  langSettingToBackendScript = {
    '2': 'LIVE_exec_py2.py',
    '3': 'LIVE_exec_py3.py',
    // empty dummy scripts just to do logging on Apache server
    'js':   'LIVE_exec_js.py',
    'ts':   'LIVE_exec_ts.py',
    'java': 'LIVE_exec_java.py',
    'ruby': 'LIVE_exec_ruby.py',
    'c':   'LIVE_exec_c.py',
    'cpp': 'LIVE_exec_cpp.py',
  };

  constructor(params) {
    super(params);

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

    $('#cumulativeModeSelector,#heapPrimitivesSelector,#textualMemoryLabelsSelector,#pythonVersionSelector').change(() => {
      this.setAceMode();
      // force a re-execute on a toggle switch
      this.executeCodeFromScratch();
    });

    this.setAceMode(); // set syntax highlighting at the end
    $("#pyOutputPane").show();


    // TODO: eliminate redundancies with pytutor.ts
    $("#jmpFirstInstr").click(() => {
      if (this.myVisualizer) {this.myVisualizer.renderStep(0);}
    });

    $("#jmpLastInstr").click(() => {
      if (this.myVisualizer) {this.myVisualizer.renderStep(this.myVisualizer.curTrace.length-1);}
    });

    $("#jmpStepBack").click(() => {
      if (this.myVisualizer) {this.myVisualizer.stepBack();}
    });

    $("#jmpStepFwd").click(() => {
      if (this.myVisualizer) {this.myVisualizer.stepForward();}
    });
  }

  // override verison in opt-frontend.ts
  setAceMode() {
    var v = $('#pythonVersionSelector').val();
    if (v !== 'js' && v !== '2' && v !== '3') {
      // we don't support live mode for this value of v, so set it to
      // python 2 by default
      $('#pythonVersionSelector').val('2');
    }
    super.setAceMode(); // delegate!
  }

  toggleSyntaxError(x) {
    if (x) {
      this.hasSyntaxError = true;
      $("#dataViz,#curInstr").addClass('dimmed'); // dim the visualization until we fix the error
    } else {
      this.hasSyntaxError = false;
      $("#dataViz,#curInstr").removeClass('dimmed'); // un-dim the visualization
      var s = this.pyInputAceEditor.getSession();
      s.clearAnnotations(); // remove any lingering syntax error labels in gutter
    }
  }

  removeAllGutterDecorations() {
    var s = this.pyInputAceEditor.getSession();
    var d = s.getDocument();

    for (var i = 0; i < d.getLength(); i++) {
      s.removeGutterDecoration(i, 'curLineStepGutter');
      s.removeGutterDecoration(i, 'prevLineStepGutter');
      s.removeGutterDecoration(i, 'curPrevOverlapLineStepGutter');
    }
  }

  updateStepLabels() {
    var myVisualizer = this.myVisualizer;
    assert(myVisualizer);
    myVisualizer.updateLineAndExceptionInfo(); // do this first to update the right fields

    $('#urlOutput,#urlOutputShortened').val(''); // prevent stale URLs

    var s = this.pyInputAceEditor.getSession();
    this.allMarkerIds.forEach((e) => {
      s.removeMarker(e);
    });
    this.allMarkerIds = [];

    // TODO: prevent copy and paste with pytutor.ts
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
    if (isLastInstr && myVisualizer.params.executeCodeWithRawInputFunc &&
        myVisualizer.promptForUserInput) {
      ruiDiv.show();
      ruiDiv.find('#userInputPromptStr').html(myVisualizer.userInputPromptStr);
      ruiDiv.find('#raw_input_textbox').val('');

      // first UNBIND handler so that we don't build up multiple click events
      ruiDiv.find('#raw_input_submit_btn')
        .unbind('click')
        .click(() => {
          var userInput = ruiDiv.find('#raw_input_textbox').val();
          var myVisualizer = this.myVisualizer;
          // advance instruction count by 1 to get to the NEXT instruction
          myVisualizer.params.executeCodeWithRawInputFunc(userInput, myVisualizer.curInstr+1);
        });
    } else {
      ruiDiv.hide(); // hide by default
    }

    // render error (if applicable):
    var curEntry = myVisualizer.curTrace[myVisualizer.curInstr];
    if (curEntry.event === 'exception' ||
        curEntry.event === 'uncaught_exception') {
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
        this.allMarkerIds.push(markerId);
      }
    } else if (myVisualizer.instrLimitReached) {
      $("#frontendErrorOutput").html(htmlspecialchars(myVisualizer.instrLimitReachedWarningMsg));
    } else {
      $("#frontendErrorOutput").html(''); // clear it
    }

    this.removeAllGutterDecorations();

    // special case if both arrows overlap
    if (myVisualizer.curLineNumber &&
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
    if (lineToScrollTo && !this.disableRowScrolling) {
      var firstVisible = this.pyInputAceEditor.getFirstVisibleRow() + 1; // +1 to be more accurate
      var lastVisible = this.pyInputAceEditor.getLastVisibleRow();
      if (lineToScrollTo < firstVisible ||
          lineToScrollTo > lastVisible) {
        this.pyInputAceEditor.scrollToLine(lineToScrollTo, true /* try to center */);
      }
    }
  }

  // see getAppState to see where it calls out to this function:
  appStateAugmenter(appState) {
    // super hack so that when you generate URLs, it will say 'display' mode
    // since we want to jump to curInstr and that happens only in 'display' mode
    appState.mode = 'display';
  }

  finishSuccessfulExecution() {
    var myVisualizer = this.myVisualizer;
    var prevVisualizer = this.prevVisualizer;
    assert(myVisualizer);
    $("#pyOutputPane,#vcrControls").show();
    this.doneExecutingCode();

    this.toggleSyntaxError(false);

    // set up execution slider, code inspired by pytutor.js:
    // TODO: eventually unify this code with pytutor.js to avoid duplication
    var sliderDiv = $('#executionSlider');
    sliderDiv.slider({min: 0, max: myVisualizer.curTrace.length - 1, step: 1});
    //disable keyboard actions on the slider itself (to prevent double-firing of events)
    sliderDiv.find(".ui-slider-handle").unbind('keydown');
    // make skinnier and taller
    sliderDiv.find(".ui-slider-handle").css('width', '0.8em');
    sliderDiv.find(".ui-slider-handle").css('height', '1.4em');
    $(".ui-widget-content").css('font-size', '0.9em');

    // unbind first to prevent multiple bindings
    (sliderDiv as any).unbind('slide').bind('slide', (evt, ui) => {
      // this is SUPER subtle. if this value was changed programmatically,
      // then evt.originalEvent will be undefined. however, if this value
      // was changed by a user-initiated event, then this code should be
      // executed ...
      if (evt.originalEvent) {
        this.myVisualizer.renderStep(ui.value);
      }
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

    this.updateStepLabels(); // do it once


    // initialize this at the VERY END after jumping to the proper initial step
    // above, perhaps using renderStep()

    // copied from opt-frontend.ts, TODO: remove redundancy
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

    // TODO: check that this logging works properly ...

    // add this hook at the VERY END after jumping to the proper initial step
    // above, perhaps using renderStep()
    myVisualizer.add_pytutor_hook(
      "end_updateOutput",
      (args) => {
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

        $('#executionSlider').slider('value', this.myVisualizer.curInstr); // update slider
        this.updateStepLabels();

        return [false];
      }
    );

    $('#executionSlider').slider('value', myVisualizer.curInstr); // update slider
    this.myVisualizer.redrawConnectors(); // to get everything aligned well
  }

  // a syntax-/compile-time error, rather than a runtime error
  handleUncaughtException(trace) {
    if (trace.length == 1 && trace[0].line) {
      var errorLineNo = trace[0].line - 1; /* Ace lines are zero-indexed */
      if (errorLineNo !== undefined && errorLineNo != NaN) {
        this.removeAllGutterDecorations();

        if (this.myVisualizer) {
          this.toggleSyntaxError(true);
          this.myVisualizer.redrawConnectors();
        }

        var s = this.pyInputAceEditor.getSession();
        s.setAnnotations([{row: errorLineNo,
                           type: 'error',
                           text: trace[0].exception_msg}]);
      }
    }
  }

  // need to override the version in opt-frontend-common.ts
  redrawConnectors() {
    if (this.myVisualizer) {
      this.myVisualizer.redrawConnectors();
    }
  }

  // override with NOP to disable diff snapshots in live mode
  snapshotCodeDiff() { }

  initAceEditor(height: number) {
    assert(!this.pyInputAceEditor);
    this.pyInputAceEditor = ace.edit('codeInputPane');
    var s = this.pyInputAceEditor.getSession();

    // disable extraneous indicators:
    s.setFoldStyle('manual'); // no code folding indicators
    s.getDocument().setNewLineMode('unix'); // canonicalize all newlines to unix format
    this.pyInputAceEditor.setHighlightActiveLine(false);
    this.pyInputAceEditor.setShowPrintMargin(false);
    this.pyInputAceEditor.setBehavioursEnabled(false);

    this.pyInputAceEditor.setHighlightGutterLine(false); // to avoid gray highlight over gutter of active line
    this.pyInputAceEditor.setDisplayIndentGuides(false); // to avoid annoying gray vertical lines

    this.pyInputAceEditor.$blockScrolling = Infinity; // kludgy to shut up weird warnings

    $("#pyInputPane,#codeInputPane")
      .css('width', '550px')
      .css('min-width', '250px')
      .css('max-width', '700px'); // don't let it get too ridiculously wide
    $('#codeInputPane').css('height', height + 'px'); // VERY IMPORTANT so that it works on I.E., ugh!

    // make it resizable!
    $("#codeInputPane").resizable({
      resize: (evt, ui) => {
        this.pyInputAceEditor.resize(); // to keep Ace internals happy
        $("#pyInputPane").width($("#codeInputPane").width()); // to keep parent happy
        if (this.myVisualizer) {
          this.myVisualizer.redrawConnectors(); // to keep visualizations happy
        }
      }
    });

    this.pyInputAceEditor.on('change', (e) => {
      $.doTimeout('pyInputAceEditorChange',
                  500, /* go a bit faster than CODE_SNAPSHOT_DEBOUNCE_MS to feel more snappy */
                  () => {
                    if (this.preseededCurInstr) {
                      this.executeCode(this.preseededCurInstr);
                      this.preseededCurInstr = undefined; // do this only once, then unset it
                    } else {
                      this.executeCodeFromScratch();
                    }
                  }); // debounce
      this.clearFrontendError();
      s.clearAnnotations();
    });

    // don't do real-time syntax checks:
    // https://github.com/ajaxorg/ace/wiki/Syntax-validation
    s.setOption("useWorker", false);
    this.pyInputAceEditor.focus();

    // custom gutter renderer, make it wider to accomodate arrows on left
    // http://stackoverflow.com/a/28404331
    s.gutterRenderer = {
      getWidth: (session, lastLineNumber, config) => {
        return (lastLineNumber.toString().length * config.characterWidth) + 6;
      },
      getText: (session, row) => {
        return (row+1);
      }
    };
  }

  executeCodeFromScratch() {
    this.disableRowScrolling = true;
    super.executeCodeFromScratch();
  }

  // TODO: maybe prevent so much copy-and-paste with the version in
  // opt-frontend-common.ts?
  executeCodeAndCreateViz(codeToExec,
                          pyState,
                          backendOptionsObj, frontendOptionsObj,
                          outputDiv) {
    var execCallback = (dataFromBackend) => {
      var trace = dataFromBackend.trace;
      if (!trace ||
          (trace.length === 0) ||
          (trace[trace.length - 1].event === 'uncaught_exception')) {
        this.handleUncaughtException(trace);

        if (trace.length === 1) {
          this.setFronendError([trace[0].exception_msg]);
        } else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
          this.setFronendError([trace[trace.length - 1].exception_msg]);
        } else {
          this.setFronendError(
                          ["Unknown error: The server may be too busy or down right now.",
                           "Please reload and try again later. Or report a bug to",
                           "philip@pgbovine.net by clicking the 'Generate permanent link'",
                           "button at the bottom and including a URL in your email."]);
        }
      } else {
        this.prevVisualizer = this.myVisualizer;
        this.myVisualizer = new ExecutionVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);
        this.finishSuccessfulExecution();
      }

      // run this all at the VERY END after all the dust has settled
      this.doneExecutingCode(); // rain or shine, we're done executing!
      this.disableRowScrolling = false;
    };

    this.clearFrontendError();
    this.startExecutingCode();

    this.setFronendError(['Running your code ...']);

    var backendScript = this.langSettingToBackendScript[pyState];
    assert(backendScript);
    var jsonp_endpoint = null;

    if (pyState === '2') {
      frontendOptionsObj.lang = 'py2';
    } else if (pyState === '3') {
      frontendOptionsObj.lang = 'py3';
    } else if (pyState === 'js') {
      frontendOptionsObj.lang = 'js';
      jsonp_endpoint = this.langSettingToJsonpEndpoint[pyState]; // maybe null
    } else {
      assert(false);
    }

    // submit update history of the "previous" visualizer whenever you
    // run the code and hopefully get a new visualizer back
    //
    // don't bother if we're currently on a syntax error since the
    // displayed visualization is no longer relevant
    var prevUpdateHistoryJSON = undefined;
    if (this.hasSyntaxError) {
      prevUpdateHistoryJSON = 'hasSyntaxError'; // hacky
    } else if (this.myVisualizer) {
      var encodedUh = this.compressUpdateHistoryList();
      prevUpdateHistoryJSON = JSON.stringify(encodedUh);
    }

    if (jsonp_endpoint) {
      assert (pyState !== '2' && pyState !== '3');
      // hack! should just be a dummy script for logging only
      $.get(backendScript,
            {user_script : codeToExec,
             options_json: JSON.stringify(backendOptionsObj),
             user_uuid: this.userUUID,
             session_uuid: this.sessionUUID,
             prevUpdateHistoryJSON: prevUpdateHistoryJSON,
             exeTime: new Date().getTime()},
             (dat) => {}, "text"); // NOP handler since it's a dummy

      // the REAL call uses JSONP
      // http://learn.jquery.com/ajax/working-with-jsonp/
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
      // for Python 2 or 3, directly execute backendScript
      assert (pyState === '2' || pyState === '3');
      $.get(backendScript,
            {user_script : codeToExec,
             raw_input_json: this.rawInputLst.length > 0 ? JSON.stringify(this.rawInputLst) : '',
             options_json: JSON.stringify(backendOptionsObj),
             user_uuid: this.userUUID,
             session_uuid: this.sessionUUID,
             prevUpdateHistoryJSON: prevUpdateHistoryJSON,
             exeTime: new Date().getTime()},
             execCallback, "json");
    }
  }

  getBaseFrontendOptionsObj() {
    var ret = super.getBaseFrontendOptionsObj();
    (ret as any).hideCode = true;
    (ret as any).jumpToEnd = true;
    return ret;
  }

} // END class OptLiveFrontend


$(document).ready(function() {
  optLiveFrontend = new OptLiveFrontend({
                                  /*TogetherjsReadyHandler: optFrontendTogetherjsReadyHandler,
                                    TogetherjsCloseHandler: optFrontendTogetherjsCloseHandler,
                                    startSharedSession: optFrontendStartSharedSession,
                                  */
                                });
  optLiveFrontend.setSurveyHTML();
});
