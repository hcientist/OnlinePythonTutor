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

// include this file BEFORE any OPT frontend file

var isExecutingCode = false; // nasty, nasty global

var appMode = 'edit'; // 'edit' or 'display'. also support
                      // 'visualize' for backward compatibility (same as 'display')

var pyInputAceEditor; // Ace editor object that contains the input code


var dmp = new diff_match_patch();
var curCode = '';
var deltaObj = undefined;

function initDeltaObj() {
  // make sure the editor already exists
  // (editor doesn't exist when you're, say, doing an iframe embed)
  if (!pyInputAceEditor) {
    return;
  }

  // v is the version number
  //   1 (version 1 was released on 2014-11-05)
  deltaObj = {start: pyInputGetValue(), deltas: [], v: 1};
}

function initAceEditor(height) {
  pyInputAceEditor = ace.edit('codeInputPane');
  var s = pyInputAceEditor.getSession();
  // tab -> 4 spaces
  s.setTabSize(4);
  s.setUseSoftTabs(true);
  // disable extraneous indicators:
  s.setFoldStyle('manual'); // no code folding indicators
  pyInputAceEditor.setHighlightActiveLine(false);
  pyInputAceEditor.setShowPrintMargin(false);
  pyInputAceEditor.setBehavioursEnabled(false);

  $('#codeInputPane').css('width', '700px');
  $('#codeInputPane').css('height', height + 'px');

  initDeltaObj();
  pyInputAceEditor.on('change', function(e) {
    $.doTimeout('pyInputAceEditorChange', 1000, snapshotCodeDiff); // debounce
  });

  // don't do real-time syntax checks:
  // https://github.com/ajaxorg/ace/wiki/Syntax-validation
  s.setOption("useWorker", false);

  setAceMode();
}

function setAceMode() {
  var mod = 'python';
  if ($('#pythonVersionSelector').val() === 'js') {
    mod = 'javascript';
  }
  assert(mod === 'python' || mod === 'javascript');
  var s = pyInputAceEditor.getSession();
  s.setMode("ace/mode/" + mod);
}

function snapshotCodeDiff() {
  if (!deltaObj) {
    return;
  }

  var newCode = pyInputGetValue();
  var timestamp = new Date().getTime();

  //console.log('Orig:', curCode);
  //console.log('New:', newCode);
  if (curCode != newCode) {
    var diff = dmp.diff_toDelta(dmp.diff_main(curCode, newCode));
    //var patch = dmp.patch_toText(dmp.patch_make(curCode, newCode));
    var delta = {t: timestamp, d: diff};
    deltaObj.deltas.push(delta);

    curCode = newCode;
  }
}

function reconstructCode() {
  var cur = '';

  var dmp = new diff_match_patch();
  var deltas = [];
  var patches = [];

  var prevTimestamp = undefined;
  $.each(deltaObj.deltas, function(i, e) {
    if (prevTimestamp) {
      assert(e.t >= prevTimestamp);
      prevTimestamp = e.t;
    }
    deltas.push(e.d);
    patches.push(e.p);
  });

  console.log(patches);
  console.log(deltas);

  //var d = dmp.diff_fromDelta('', "+x = 1")
  //var p = dmp.patch_make(d)
  //dmp.patch_apply(p, '')

  //x = dmp.patch_fromText("@@ -0,0 +1,5 @@\n+x = 1\n")
  //dmp.patch_apply(x, '')
  //x = dmp.patch_fromText("@@ -1,5 +1,12 @@\n x = 1\n+%0Ax = 2%0A\n")
  //dmp.patch_apply(x, 'x = 1')
}


// Global hook for ExecutionVisualizer.
var try_hook = function(hook_name, args) {
  return [false]; // just a stub
}

var myVisualizer = null; // singleton ExecutionVisualizer instance

var rawInputLst = []; // a list of strings inputted by the user in response to raw_input or mouse_input events


// each frontend must implement its own executeCode function
function executeCode() {
  alert("Configuration error. Need to override executeCode(). This is an empty stub.");
}

function redrawConnectors() {
  if (appMode == 'display' || appMode == 'visualize' /* deprecated */) {
    if (myVisualizer) {
      myVisualizer.redrawConnectors();
    }
  }
}

function setFronendError(lines) {
  $("#frontendErrorOutput").html(lines.map(htmlspecialchars).join('<br/>'));
  $("#frontendErrorOutput").show();
}

function clearFrontendError() {
  $("#frontendErrorOutput").hide();
}


// From http://diveintohtml5.info/storage.html
function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

// abstraction so that we can use either CodeMirror or Ace as our code editor
function pyInputGetValue() {
  return pyInputAceEditor.getValue();
}

function pyInputSetValue(dat) {
  pyInputAceEditor.setValue(dat.rtrim() /* kill trailing spaces */,
                            -1 /* do NOT select after setting text */);

  $('#urlOutput,#embedCodeOutput').val('');

  clearFrontendError();

  // also scroll to top to make the UI more usable on smaller monitors
  $(document).scrollTop(0);
}


function pyInputGetScrollTop() {
  return pyInputAceEditor.getSession().getScrollTop();
}

function pyInputSetScrollTop(st) {
  pyInputAceEditor.getSession().setScrollTop(st);
}


// run at the END so that everything else can be initialized first
function genericOptFrontendReady() {
  // be friendly to the browser's forward and back buttons
  // thanks to http://benalman.com/projects/jquery-bbq-plugin/
  $(window).bind("hashchange", function(e) {
    // if you've got some preseeded code, then parse the entire query
    // string from scratch just like a page reload
    if ($.bbq.getState('code')) {
      parseQueryString();
    }
    // otherwise just do an incremental update
    else {
      var newMode = $.bbq.getState('mode');
      //console.log('hashchange:', newMode, window.location.hash);
      updateAppDisplay(newMode);
    }
  });


  initAceEditor(420);


  pyInputAceEditor.getSession().on("change", function(e) {
    // unfortunately, Ace doesn't detect whether a change was caused
    // by a setValue call
    //if (TogetherJS.running) {
    //  TogetherJS.send({type: "codemirror-edit"});
    //}
  });


  // don't sync for Ace since I can't get it working properly yet
  /*
  pyInputAceEditor.getSession().on('changeScrollTop', function() {
    if (TogetherJS.running) {
      $.doTimeout('codeInputScroll', 100, function() { // debounce
        // note that this will send a signal back and forth both ways
        // (there's no easy way to prevent this), but it shouldn't keep
        // bouncing back and forth indefinitely since no the second signal
        // causes no additional scrolling
        TogetherJS.send({type: "codeInputScroll",
                         scrollTop: pyInputGetScrollTop()});
      });
    }
  });
  */


  // first initialize options from HTML LocalStorage. very important
  // that this code runs first so that options get overridden by query
  // string options and anything else the user wants to override with.
  if (supports_html5_storage()) {
    var lsKeys = ['cumulative',
                  'drawParentPointers',
                  'heapPrimitives',
                  'py',
                  'showOnlyOutputs',
                  'textReferences'];
    // restore toggleState if available
    var lsOptions = {};
    $.each(lsKeys, function(i, k) {
      var v = localStorage.getItem(k);
      if (v) {
        lsOptions[k] = v;
      }
    });
    setToggleOptions(lsOptions);

    // store in localStorage whenever user explicitly changes any toggle option:
    $('#cumulativeModeSelector,#heapPrimitivesSelector,#drawParentPointerSelector,#textualMemoryLabelsSelector,#showOnlyOutputsSelector,#pythonVersionSelector').change(function() {
      var ts = getToggleState();
      $.each(ts, function(k, v) {
        localStorage.setItem(k, v);
      });
    });
  }

  parseQueryString();

  $(window).resize(redrawConnectors);

  $('#genUrlBtn').bind('click', function() {
    var myArgs = getAppState();
    var urlStr = $.param.fragment(window.location.href, myArgs, 2 /* clobber all */);
    $('#urlOutput').val(urlStr);
  });


  // register a generic AJAX error handler
  $(document).ajaxError(function(evt, jqxhr, settings, exception) {
    setFronendError(["Server error! Your code might be too long to properly visualize (e.g., over 100 lines),",
                     "so try again with a smaller piece of code.",
                     "Or report a bug to philip@pgbovine.net by clicking on the 'Generate URL'",
                     "button at the bottom and including a URL in your email."]);

    doneExecutingCode();
  });

  clearFrontendError();

  $("#embedLinkDiv").hide();
  $("#executeBtn").attr('disabled', false);
  $("#executeBtn").click(executeCodeFromScratch);

  $('#pythonVersionSelector').change(setAceMode); // update syntax highlighting mode
}


// sets globals such as rawInputLst, code input box, and toggle options
function parseQueryString() {
  var queryStrOptions = getQueryStringOptions();
  setToggleOptions(queryStrOptions);
  if (queryStrOptions.preseededCode) {
    pyInputSetValue(queryStrOptions.preseededCode);
  }
  if (queryStrOptions.rawInputLst) {
    rawInputLst = queryStrOptions.rawInputLst; // global
  }
  else {
    rawInputLst = [];
  }

  // ugh tricky -- always start in edit mode by default, and then
  // switch to display mode only after the code successfully executes
  appMode = 'edit';
  if ((queryStrOptions.appMode == 'display' ||
       queryStrOptions.appMode == 'visualize' /* 'visualize' is deprecated */) &&
      queryStrOptions.preseededCode /* jump to display only with pre-seeded code */) {
    executeCode(queryStrOptions.preseededCurInstr); // will switch to 'display' mode
  }
  $.bbq.removeState(); // clean up the URL no matter what
}

// parsing the URL query string hash
function getQueryStringOptions() {
  var ril = $.bbq.getState('rawInputLstJSON');
  // note that any of these can be 'undefined'
  return {preseededCode: $.bbq.getState('code'),
          preseededCurInstr: Number($.bbq.getState('curInstr')),
          verticalStack: $.bbq.getState('verticalStack'),
          appMode: $.bbq.getState('mode'),
          py: $.bbq.getState('py'),
          cumulative: $.bbq.getState('cumulative'),
          heapPrimitives: $.bbq.getState('heapPrimitives'),
          drawParentPointers: $.bbq.getState('drawParentPointers'),
          textReferences: $.bbq.getState('textReferences'),
          showOnlyOutputs: $.bbq.getState('showOnlyOutputs'),
          rawInputLst: ril ? $.parseJSON(ril) : undefined
          };
}

function setToggleOptions(dat) {
  // ugh, ugly tristate due to the possibility of each being undefined
  if (dat.py !== undefined) {
    $('#pythonVersionSelector').val(dat.py);
  }
  if (dat.cumulative !== undefined) {
    $('#cumulativeModeSelector').val(dat.cumulative);
  }
  if (dat.heapPrimitives !== undefined) {
    $('#heapPrimitivesSelector').val(dat.heapPrimitives);
  }
  if (dat.drawParentPointers !== undefined) {
    $('#drawParentPointerSelector').val(dat.drawParentPointers);
  }
  if (dat.textReferences !== undefined) {
    $('#textualMemoryLabelsSelector').val(dat.textReferences);
  }
  if (dat.showOnlyOutputs !== undefined) {
    $('#showOnlyOutputsSelector').val(dat.showOnlyOutputs);
  }
}

// get the ENTIRE current state of the app
function getAppState() {
  assert(originFrontendJsFile); // global var defined in each frontend

  var ret = {code: pyInputGetValue(),
             mode: appMode,
             origin: originFrontendJsFile,
             cumulative: $('#cumulativeModeSelector').val(),
             heapPrimitives: $('#heapPrimitivesSelector').val(),
             drawParentPointers: $('#drawParentPointerSelector').val(),
             textReferences: $('#textualMemoryLabelsSelector').val(),
             showOnlyOutputs: $('#showOnlyOutputsSelector').val(),
             py: $('#pythonVersionSelector').val(),
             /* ALWAYS JSON serialize rawInputLst, even if it's empty! */
             rawInputLstJSON: JSON.stringify(rawInputLst),
             curInstr: myVisualizer ? myVisualizer.curInstr : undefined};

  // keep this really clean by avoiding undefined values
  if (ret.cumulative === undefined)
    delete ret.cumulative;
  if (ret.heapPrimitives === undefined)
    delete ret.heapPrimitives;
  if (ret.drawParentPointers === undefined)
    delete ret.drawParentPointers;
  if (ret.textReferences === undefined)
    delete ret.textReferences;
  if (ret.showOnlyOutputs === undefined)
    delete ret.showOnlyOutputs;
  if (ret.py === undefined)
    delete ret.py;
  if (ret.rawInputLstJSON === undefined)
    delete ret.rawInputLstJSON;
  if (ret.curInstr === undefined)
    delete ret.curInstr;

  return ret;
}

// return whether two states match, except don't worry about curInstr
function appStateEq(s1, s2) {
  assert(s1.origin == s2.origin); // sanity check!

  return (s1.code == s2.code &&
          s1.mode == s2.mode &&
          s1.cumulative == s2.cumulative &&
          s1.heapPrimitives == s1.heapPrimitives &&
          s1.drawParentPointers == s2.drawParentPointers &&
          s1.textReferences == s2.textReferences &&
          s1.showOnlyOutputs == s2.showOnlyOutputs &&
          s1.py == s2.py &&
          s1.rawInputLstJSON == s2.rawInputLstJSON);
}

// strip it down to the bare minimum
function getToggleState() {
  var x = getAppState();
  delete x.code;
  delete x.mode;
  delete x.rawInputLstJSON;
  delete x.curInstr;
  return x;
}

// sets the global appMode variable if relevant and also the URL hash to
// support some amount of Web browser back button goodness
function updateAppDisplay(newAppMode) {
  // idempotence is VERY important here
  if (newAppMode == appMode) {
    return;
  }

  appMode = newAppMode; // global!

  if (appMode === undefined || appMode == 'edit' ||
      !myVisualizer /* subtle -- if no visualizer, default to edit mode */) {
    appMode = 'edit'; // canonicalize

    $("#pyInputPane").show();
    $("#pyOutputPane,#surveyHeader").hide();
    $("#embedLinkDiv").hide();

    $(".surveyQ").val(''); // clear all survey results when user hits forward/back

    // destroy all annotation bubbles (NB: kludgy)
    if (myVisualizer) {
      myVisualizer.destroyAllAnnotationBubbles();
    }

    // Potentially controversial: when you enter edit mode, DESTROY any
    // existing visualizer object. note that this simplifies the app's
    // conceptual model but breaks the browser's expected Forward and
    // Back button flow
    $("#pyOutputPane").empty();
    myVisualizer = null;

    $(document).scrollTop(0); // scroll to top to make UX better on small monitors

    $.bbq.pushState({ mode: 'edit' }, 2 /* completely override other hash strings to keep URL clean */);
  }
  else if (appMode == 'display' || appMode == 'visualize' /* 'visualize' is deprecated */) {
    assert(myVisualizer);
    appMode = 'display'; // canonicalize

    $("#pyInputPane").hide();
    $("#pyOutputPane").show();
    $("#embedLinkDiv").show();

    doneExecutingCode();

    // do this AFTER making #pyOutputPane visible, or else
    // jsPlumb connectors won't render properly
    myVisualizer.updateOutput();

    // customize edit button click functionality AFTER rendering (NB: awkward!)
    $('#pyOutputPane #editCodeLinkDiv').show();
    $('#pyOutputPane #editBtn').click(function() {
      enterEditMode();
    });

    $(document).scrollTop(0); // scroll to top to make UX better on small monitors


    // NASTY global :(
    if (pendingCodeOutputScrollTop) {
      myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(pendingCodeOutputScrollTop);
      pendingCodeOutputScrollTop = null;
    }

    $.doTimeout('pyCodeOutputDivScroll'); // cancel any prior scheduled calls

    myVisualizer.domRoot.find('#pyCodeOutputDiv').scroll(function(e) {
      var elt = $(this);
      // debounce
      $.doTimeout('pyCodeOutputDivScroll', 100, function() {
        // note that this will send a signal back and forth both ways
        /*
        if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
          // (there's no easy way to prevent this), but it shouldn't keep
          // bouncing back and forth indefinitely since no the second signal
          // causes no additional scrolling
          TogetherJS.send({type: "pyCodeOutputDivScroll",
                           scrollTop: elt.scrollTop()});
        }
        */
      });
    });

    $.bbq.pushState({ mode: 'display' }, 2 /* completely override other hash strings to keep URL clean */);
  }
  else {
    assert(false);
  }

  $('#urlOutput,#embedCodeOutput').val(''); // clear to avoid stale values
}


function executeCodeFromScratch() {
  // don't execute empty string:
  if ($.trim(pyInputGetValue()) == '') {
    setFronendError(["Type in some code to visualize."]);
    return;
  }

  rawInputLst = []; // reset!
  executeCode();
}

function executeCodeWithRawInput(rawInputStr, curInstr) {
  rawInputLst.push(rawInputStr);
  console.log('executeCodeWithRawInput', rawInputStr, curInstr, rawInputLst);
  executeCode(curInstr);
}


function handleUncaughtExceptionFunc(trace) {
  if (trace.length == 1 && trace[0].line) {
    var errorLineNo = trace[0].line - 1; /* Ace lines are zero-indexed */
    if (errorLineNo !== undefined && errorLineNo != NaN) {
      // highlight the faulting line
      var s = pyInputAceEditor.getSession();
      s.setAnnotations([{row: errorLineNo,
                         type: 'error',
                         text: trace[0].exception_msg}]);
      pyInputAceEditor.gotoLine(errorLineNo + 1 /* one-indexed */);
    }
  }
}

function startExecutingCode() {
  $('#executeBtn').html("Please wait ... processing your code");
  $('#executeBtn').attr('disabled', true);
  isExecutingCode = true; // nasty global
}

function doneExecutingCode() {
  $('#executeBtn').html("Visualize Execution");
  $('#executeBtn').attr('disabled', false);
  isExecutingCode = false; // nasty global
}


function enterDisplayMode() {
  updateAppDisplay('display');
}

function enterEditMode() {
  updateAppDisplay('edit');
}


function optFinishSuccessfulExecution() {
  enterDisplayMode(); // do this first!

  // 2014-05-25: implemented more detailed tracing for surveys
  myVisualizer.creationTime = new Date();
  // each element will be a two-element list consisting of:
  // [step number, milliseconds elapsed since creationTime]
  // ("debounce" entries that are less than 1 second apart to
  // compress the logs a bit when there's rapid scrubbing or scrolling)
  myVisualizer.updateHistory = [];
  myVisualizer.updateHistory.push([myVisualizer.curInstr, 0]); // seed it!

  // For version 3+, dynamically generate a survey whenever the user
  // successfully executes a piece of code
  initializeDisplayModeSurvey();
}


// TODO: cut reliance on the nasty rawInputLst global
function executePythonCode(pythonSourceCode,
                           backendScript, backendOptionsObj,
                           frontendOptionsObj,
                           outputDiv,
                           handleSuccessFunc, handleUncaughtExceptionFunc) {
    if (!backendScript) {
      setFronendError(["Server configuration error: No backend script",
                       "Report a bug to philip@pgbovine.net by clicking on the 'Generate URL'",
                       "button at the bottom and including a URL in your email."]);
      return;
    }

    snapshotCodeDiff(); // do ONE MORE snapshot before we execute, or else
                        // we'll miss a diff if the user hits Visualize Execution
                        // very shortly after finishing coding
    if (deltaObj) {
      deltaObj.executeTime = new Date().getTime();
    }

    // if you're in display mode, kick back into edit mode before
    // executing or else the display might not refresh properly ... ugh
    // krufty FIXME
    enterEditMode();

    clearFrontendError();
    startExecutingCode();

    $.get(backendScript,
          {user_script : pythonSourceCode,
           raw_input_json: rawInputLst.length > 0 ? JSON.stringify(rawInputLst) : '',
           options_json: JSON.stringify(backendOptionsObj),
           // if we don't have any deltas, then don't bother sending deltaObj:
           diffs_json: deltaObj && (deltaObj.deltas.length > 0) ? JSON.stringify(deltaObj) : null},
          function(dataFromBackend) {
            var trace = dataFromBackend.trace;

            // don't enter visualize mode if there are killer errors:
            if (!trace ||
                (trace.length == 0) ||
                (trace[trace.length - 1].event == 'uncaught_exception')) {

              handleUncaughtExceptionFunc(trace);

              if (trace.length == 1) {
                setFronendError([trace[0].exception_msg]);
              }
              else if (trace[trace.length - 1].exception_msg) {
                setFronendError([trace[trace.length - 1].exception_msg]);
              }
              else {
                setFronendError(["Unknown error. Reload the page and try again.",
                                 "Report a bug to philip@pgbovine.net by clicking on the 'Generate URL'",
                                 "button at the bottom and including a URL in your email."]);
              }
            }
            else {
              // fail-soft to prevent running off of the end of trace
              if (frontendOptionsObj.startingInstruction >= trace.length) {
                frontendOptionsObj.startingInstruction = 0;
              }

              if (frontendOptionsObj.holisticMode) {
                // do NOT override, or else bad things will happen with
                // jsPlumb arrows interfering ...
                delete frontendOptionsObj.visualizerIdOverride;

                myVisualizer = new HolisticVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);
              } else {
                myVisualizer = new ExecutionVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);
              }
              // SUPER HACK -- slip in backendOptionsObj as an extra field
              myVisualizer.backendOptionsObj = backendOptionsObj;

              handleSuccessFunc();

              // VERY SUBTLE -- reinitialize TogetherJS so that it can detect
              // and sync any new elements that are now inside myVisualizer
              /*
              if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
                TogetherJS.reinitialize();
              }
              */
            }

            doneExecutingCode(); // rain or shine, we're done executing!
            // run this at the VERY END after all the dust has settled
          },
          "json");


    initDeltaObj(); // clear deltaObj to start counting over again
}

