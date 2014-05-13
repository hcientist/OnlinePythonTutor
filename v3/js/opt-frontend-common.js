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

// include this file BEFORE any OPT frontend files


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


var isExecutingCode = false; // nasty, nasty global


var appMode = 'edit'; // 'edit' or 'display'. also support
                      // 'visualize' for backward compatibility (same as 'display')

var preseededCurInstr = null; // if you passed in a 'curInstr=<number>' in the URL, then set this var

var pyInputCodeMirror; // CodeMirror object that contains the input text

function setCodeMirrorVal(dat) {
  pyInputCodeMirror.setValue(dat.rtrim() /* kill trailing spaces */);
  $('#urlOutput,#embedCodeOutput').val('');

  // also scroll to top to make the UI more usable on smaller monitors
  $(document).scrollTop(0);
}


// From: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}


var myVisualizer = null; // singleton ExecutionVisualizer instance

var rawInputLst = []; // a list of strings inputted by the user in response to raw_input or mouse_input events


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


// run at the END so that everything else can be initialized first
function genericOptFrontendReady() {
  pyInputCodeMirror = CodeMirror(document.getElementById('codeInputPane'), {
    mode: 'python',
    lineNumbers: true,
    tabSize: 4,
    indentUnit: 4,
    // convert tab into four spaces:
    extraKeys: {Tab: function(cm) {cm.replaceSelection("    ", "end");}}
  });

  pyInputCodeMirror.setSize(null, '420px');


  var queryStrOptions = getQueryStringOptions();
  setToggleOptions(queryStrOptions);

  if (queryStrOptions.preseededCode) {
    setCodeMirrorVal(queryStrOptions.preseededCode);
  }

  // ugh tricky -- always start in edit mode by default, and then
  // simulate a click to get it to switch to display mode ONLY after the
  // code successfully executes
  appMode = 'edit';
  if ((queryStrOptions.appMode == 'display' ||
       queryStrOptions.appMode == 'visualize' /* 'visualize' is deprecated */) &&
      queryStrOptions.preseededCode /* jump to display only with pre-seeded code */) {
    console.log('seeded in display mode');
    preseededCurInstr = queryStrOptions.preseededCurInstr; // ugly global
    $("#executeBtn").trigger('click');
  }
  $.bbq.removeState(); // clean up the URL no matter what

  $(window).resize(redrawConnectors);

  $('#genUrlBtn').bind('click', function() {
    var myArgs = getAppState();
    var urlStr = $.param.fragment(window.location.href, myArgs, 2 /* clobber all */);
    $('#urlOutput').val(urlStr);
  });


  // register a generic AJAX error handler
  $(document).ajaxError(function(evt, jqxhr, settings, exception) {
    // ignore errors related to togetherjs stuff:
    if (settings.url.indexOf('togetherjs') > -1) {
      return; // get out early
    }

    setFronendError(["Server error! Your code might be too long to properly visualize (e.g., over 100 lines),",
                     "so try again with a smaller piece of code.",
                     "Or report a bug to philip@pgbovine.net by clicking on the 'Generate URL'",
                     "button at the bottom and including a URL in your email."]);

    doneExecutingCode();
  });

  clearFrontendError();
}

function getQueryStringOptions() {
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
  var ret = {code: pyInputCodeMirror.getValue(),
             mode: appMode,
             cumulative: $('#cumulativeModeSelector').val(),
             heapPrimitives: $('#heapPrimitivesSelector').val(),
             drawParentPointers: $('#drawParentPointerSelector').val(),
             textReferences: $('#textualMemoryLabelsSelector').val(),
             showOnlyOutputs: $('#showOnlyOutputsSelector').val(),
             py: $('#pythonVersionSelector').val(),
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
  if (ret.curInstr === undefined)
    delete ret.curInstr;

  return ret;
}

// return whether two states match, except don't worry about curInstr
function appStateEq(s1, s2) {
  return (s1.code == s2.code &&
          s1.mode == s2.mode &&
          s1.cumulative == s2.cumulative &&
          s1.heapPrimitives == s1.heapPrimitives &&
          s1.drawParentPointers == s2.drawParentPointers &&
          s1.textReferences == s2.textReferences &&
          s1.showOnlyOutputs == s2.showOnlyOutputs &&
          s1.py == s2.py);
}

// sets the proper GUI features to match the given appState object
function setVisibleAppState(appState) {
  setCodeMirrorVal(appState.code);

  $('#cumulativeModeSelector').val(appState.cumulative);
  $('#heapPrimitivesSelector').val(appState.heapPrimitives);
  $('#drawParentPointerSelector').val(appState.drawParentPointers);
  $('#textualMemoryLabelsSelector').val(appState.textReferences);
  $('#showOnlyOutputsSelector').val(appState.showOnlyOutputs);
  $('#pythonVersionSelector').val(appState.py);
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
    //$(document).unbind('keydown'); // also kill kb bindings to avoid staleness

    $(document).scrollTop(0); // scroll to top to make UX better on small monitors

    $.bbq.pushState({ mode: 'edit' }, 2 /* completely override other hash strings to keep URL clean */);
  }
  else if (appMode == 'display' || appMode == 'visualize' /* 'visualize' is deprecated */) {
    assert(myVisualizer);
    appMode = 'display'; // canonicalize

    $("#pyInputPane").hide();
    $("#pyOutputPane,#surveyHeader").show();
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

    $.bbq.pushState({ mode: 'display' }, 2 /* completely override other hash strings to keep URL clean */);
  }
  else {
    assert(false);
  }

  $('#urlOutput,#embedCodeOutput').val(''); // clear to avoid stale values
}


function handleUncaughtExceptionFunc(trace) {
  if (trace.length == 1 && trace[0].line) {
    var errorLineNo = trace[0].line - 1; /* CodeMirror lines are zero-indexed */
    if (errorLineNo !== undefined && errorLineNo != NaN) {
      // highlight the faulting line in pyInputCodeMirror
      pyInputCodeMirror.focus();
      pyInputCodeMirror.setCursor(errorLineNo, 0);
      pyInputCodeMirror.addLineClass(errorLineNo, null, 'errorLine');

      function f() {
        pyInputCodeMirror.removeLineClass(errorLineNo, null, 'errorLine'); // reset line back to normal
        pyInputCodeMirror.off('change', f);
      }
      pyInputCodeMirror.on('change', f);
    }

    doneExecutingCode();
  }
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

    isExecutingCode = true; // nasty global

    clearFrontendError();

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

                // set keyboard bindings
                // VERY IMPORTANT to clear and reset this every time or
                // else the handlers might be bound multiple times
                // NIX keyboard bindings since they're not easily
                // discoverable and also interfere with TogetherJS chatting
                /*
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
                */
              }

              handleSuccessFunc();
            }
          },
          "json");
}


/* For survey questions:

Versions of survey wording:

v1:

<p style="margin-top: 10px; line-height: 175%;">

[Optional] Please answer these questions to support our research and to help improve this tool.<br/>

Where is your code from? <input type="text" id="code-origin-Q" class="surveyQ" size=60 maxlength=140/><br/>

What do you hope to learn by visualizing it? <input type="text" id="what-learn-Q" class="surveyQ" size=60 maxlength=140/><br/>

How did you find this web site? <input type="text" id="how-find-Q" class="surveyQ" size=60 maxlength=140/>

<input type="hidden" id="Q-version" value="v1"/> <!-- for versioning -->

</p>

*/

var survey_v1 = '\n\
<p style="margin-top: 10px; line-height: 175%;">\n\
[Optional] Please answer these questions to support our research and to help improve this tool.<br/>\n\
Where is your code from? <input type="text" id="code-origin-Q" class="surveyQ" size=60 maxlength=140/><br/>\n\
What do you hope to learn by visualizing it? <input type="text" id="what-learn-Q" class="surveyQ" size=60 maxlength=140/><br/>\n\
How did you find this web site? <input type="text" id="how-find-Q" class="surveyQ" size=60 maxlength=140/>\n\
<input type="hidden" id="Q-version" value="v1"/> <!-- for versioning -->\n\
</p>'

var survey_html = survey_v1;

function setSurveyHTML() {
  $('#surveyPane').html(survey_html);
}

function getSurveyObject() {
  var code_origin_Q_val = $('#code-origin-Q').val();
  var what_learn_Q_val = $('#what-learn-Q').val();
  var how_find_Q_val = $('#how-find-Q').val();

  var ret = null;

  if (code_origin_Q_val || what_learn_Q_val || how_find_Q_val) {
    ret = {
      ver: $('#Q-version').val(),
      code_origin_Q: code_origin_Q_val,
      what_learn_Q: what_learn_Q_val,
      how_find_Q: how_find_Q_val,
    }
  }

 return ret;
}
