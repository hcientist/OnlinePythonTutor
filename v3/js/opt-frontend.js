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


// TODO: combine and minify with https://github.com/mishoo/UglifyJS2
// and add version numbering using a ?-style query string to prevent
// caching snafus


// Pre-reqs:
// - pytutor.js
// - jquery.ba-bbq.min.js
// - opt-frontend-common.js
// should all be imported BEFORE this file


function redrawConnectors() {
  if (appMode == 'display' || appMode == 'visualize' /* 'visualize' is deprecated */) {
    if (myVisualizer) {
      myVisualizer.redrawConnectors();
    }
  }
}


// EXPERIMENTAL
var enableTogetherJS = false;

var TogetherJSConfig_disableWebRTC = true;
var TogetherJSConfig_suppressJoinConfirmation = true;
var TogetherJSConfig_dontShowClicks = true;

// stop popping up boring intro dialog box:
var TogetherJSConfig_seenIntroDialog = true;

// suppress annoying pop-ups:
var TogetherJSConfig_suppressInvite = true;
var TogetherJSConfig_suppressJoinConfirmation = true;

// clone clicks ONLY in certain elements to keep things simple:
var TogetherJSConfig_cloneClicks = '#pyInputPane select,#pyInputPane #executeBtn';

var TogetherJSConfig_siteName = "Online Python Tutor live help";
var TogetherJSConfig_toolName = "Online Python Tutor live help";

var isTutor = false;

// TODO: consider deferred initialization later: "TogetherJS starts up
// automatically as soon as it can, especially when continuing a
// session. Sometimes this is problematic, like an application that
// bootstraps all of its UI after page load. To defer this
// initialization, define a function TogetherJSConfig_callToStart like:"
//TogetherJSConfig_callToStart = function (callback) {
//};


// nasty globals
var updateOutputSignalFromRemote = false;
var hashchangeSignalFromRemote = false;
var nowSyncing = false;

// Global hook for ExecutionVisualizer.
var try_hook = function(hook_name, args) {
  return [false]; // just a stub
}


function requestSync() {
  if (TogetherJS.running) {
    nowSyncing = true;
    TogetherJS.send({type: "requestSync"});
  }
}

// get this app ready for TogetherJS
function initTogetherJS() {
  $("#surveyHeader").remove(); // kill this to save space

  if (isTutor) {
    $("#togetherBtn").html("TUTOR - Join live help session");
    $("#togetherJSHeader").append('<button id="syncBtn"\
                                   type="button">Sync with learner</button>');

    $("#syncBtn").click(requestSync);
  }

  // Global hook for ExecutionVisualizer.
  // Set it here after TogetherJS gets defined, hopefully!
  try_hook = function(hook_name, args) {
    if (hook_name == "end_updateOutput") {
      if (updateOutputSignalFromRemote) {
        return;
      }
      if (TogetherJS.running && !nowSyncing /* don't perterb when syncing */) {
        TogetherJS.send({type: "updateOutput", step: args.myViz.curInstr});
      }
    }
    return [false];
  }

  TogetherJS.hub.on("updateOutput", function(msg) {
    if (!msg.sameUrl) {
      return;
    }
    if (myVisualizer) {
      console.log("updateOutput:", msg);
      // to prevent this call to updateOutput from firing its own TogetherJS event
      updateOutputSignalFromRemote = true;
      try {
        myVisualizer.renderStep(msg.step);
      }
      finally {
        updateOutputSignalFromRemote = false;
      }
    }
  });

  TogetherJS.hub.on("hashchange", function(msg) {
    if (!msg.sameUrl) {
      return;
    }
    hashchangeSignalFromRemote = true;
    try {
      console.log("TogetherJS RECEIVE hashchange", msg.appMode);
      appMode = msg.appMode; // assign this to the GLOBAL appMode
      updateAppDisplay();
    }
    finally {
      hashchangeSignalFromRemote = false;
    }
  });

  // learner receives a sync request from tutor and responds by
  // sending its current app state
  TogetherJS.hub.on("requestSync", function(msg) {
    // only a learner should receive sync requests from a tutor
    if (isTutor) {
      return;
    }

    if (TogetherJS.running) {
      TogetherJS.send({type: "myAppState", myAppState: getAppState()});
    }
  });

  // tutor receives an app state from a learner
  // TODO: what happens if more than one learner sends state to tutor?
  // i suppose the last one wins at this point :/
  TogetherJS.hub.on("myAppState", function(msg) {
    // only a tutor should handle receiving an app state from a learner
    if (!isTutor) {
      return;
    }

    try {
      var learnerAppState = msg.myAppState;

      // if available, first set my own app state to visualizedAppState
      // and then EXECUTE that code with the given options to create the
      // proper myVisualizer object. then adjust app state to the rest
      // of learnerAppState

      if (learnerAppState.visualizedAppState) {
        setVisibleAppState(learnerAppState.visualizedAppState);
        // execute code and jump to the learner's curInstr
        executeCode(learnerAppState.curInstr);
      }

      setVisibleAppState(learnerAppState);

      appMode = learnerAppState.mode;
      updateAppDisplay();
    }
    finally {
      nowSyncing = false; // done with a successful sync round trip
    }
  });


  try {
    var source = new EventSource('http://togetherjs.pythontutor.com/learner-SSE');
    source.onmessage = function(e) {
      var dat = JSON.parse(e.data);

      if (dat.helpQueueUrls == 1) {
        $("#helpQueueUrls").html('Please wait ... there is now 1 person in the queue.');
      }
      else if (dat.helpQueueUrls == 0 || dat.helpQueueUrls > 1) {
        $("#helpQueueUrls").html('Please wait ... there are now ' + dat.helpQueueUrls +
                                   ' people in the queue.');
      }
      else {
        $("#helpQueueUrls").html('');
      }

      if (dat.helpAvailable) {
        $("#togetherJSHeader").fadeIn(750, redrawConnectors);
      }
      else {
        if (TogetherJS.running) {
          alert("No more live tutors are available now.\nPlease check back later.");
          TogetherJS(); // toggle off
        }
        $("#togetherJSHeader").fadeOut(750, redrawConnectors);
      }
    };
  }
  catch(err) {
    // ugh, SSE doesn't work in Safari when testing on localhost,
    // but I think it works when deployed on pythontutor.com
    console.warn("Sad ... EventSource not supported :(");
  }

  $("#togetherBtn").click(function() {
    TogetherJS(); // toggles on and off
  });

  // fired when TogetherJS is activated. might fire on page load if there's
  // already an open session from a prior page load in the recent past.
  TogetherJS.on("ready", function () {
    console.log("TogetherJS ready");
    $("#togetherBtn").html("Stop live help session");

    $("#helpQueueUrls").fadeIn(500);

    $("#togetherJSHeader").fadeIn(750, redrawConnectors); // always show when ready

    if (isTutor) {
      // if you're a tutor, immediately try to sync to the learner upon startup
      requestSync();
    }
    else {
      // if you're a learner, request help when TogetherJS is activated
      $.get("http://togetherjs.pythontutor.com/request-help",
            {url: TogetherJS.shareUrl()},
            null /* don't use a callback; rely on SSE */);
    }
  });

  // emitted when TogetherJS is closed. This is not emitted when the
  // page simply closes or navigates elsewhere. It is only closed when
  // TogetherJS is specifically stopped.
  TogetherJS.on("close", function () {
    console.log("TogetherJS close");

    $("#helpQueueUrls").fadeOut(500);

    if (isTutor) {
      $("#togetherBtn").html("TUTOR - Join live help session");
    }
    else {
      $("#togetherBtn").html("Get live help now");
    }
  });
}


function executeCode(forceStartingInstr) {
  var backend_script = null;
  if ($('#pythonVersionSelector').val() == '2') {
      backend_script = python2_backend_script;
  }
  else if ($('#pythonVersionSelector').val() == '3') {
      backend_script = python3_backend_script;
  }
  // experimental KRAZY MODE!!!
  else if ($('#pythonVersionSelector').val() == '2crazy') {
      backend_script = python2crazy_backend_script;
  }

  $('#executeBtn').html("Please wait ... processing your code");
  $('#executeBtn').attr('disabled', true);
  $("#pyOutputPane").hide();
  $("#embedLinkDiv").hide();

  var backendOptionsObj = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
                           heap_primitives: ($('#heapPrimitivesSelector').val() == 'true'),
                           show_only_outputs: ($('#showOnlyOutputsSelector').val() == 'true'),
                           py_crazy_mode: ($('#pythonVersionSelector').val() == '2crazy'),
                           origin: 'opt-frontend.js'};

  var surveyObj = getSurveyObject();
  if (surveyObj) {
    backendOptionsObj.survey = surveyObj;
  }

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
                            // tricky: selector 'true' and 'false' values are strings!
                            disableHeapNesting: ($('#heapPrimitivesSelector').val() == 'true'),
                            drawParentPointers: ($('#drawParentPointerSelector').val() == 'true'),
                            textualMemoryLabels: ($('#textualMemoryLabelsSelector').val() == 'true'),
                            showOnlyOutputs: ($('#showOnlyOutputsSelector').val() == 'true'),
                            executeCodeWithRawInputFunc: executeCodeWithRawInput,
                            // if TogetherJS is enabled, always use the same
                            // visualizer ID for all ExecutionVisualizer
                            // objects, so that they can sync properly
                            visualizerIdOverride: enableTogetherJS ? '1' : undefined,
                            updateOutputCallback: function() {$('#urlOutput,#embedCodeOutput').val('');},

                            // undocumented experimental modes:
                            pyCrazyMode: ($('#pythonVersionSelector').val() == '2crazy'),
                            holisticMode: ($('#cumulativeModeSelector').val() == 'holistic')
                           }

  executePythonCode(pyInputCodeMirror.getValue(),
                    backend_script, backendOptionsObj,
                    frontendOptionsObj,
                    'pyOutputPane',
                    enterDisplayMode, handleUncaughtExceptionFunc);
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


$(document).ready(function() {
  setSurveyHTML();

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

  var role = $.bbq.getState('role');
  isTutor = (role == 'tutor'); // GLOBAL

  if (enableTogetherJS || isTutor) {
    initTogetherJS(); // can also call this manually to test
  }


  // be friendly to the browser's forward and back buttons
  // thanks to http://benalman.com/projects/jquery-bbq-plugin/
  $(window).bind("hashchange", function(e) {
    appMode = $.bbq.getState('mode'); // assign this to the GLOBAL appMode
    updateAppDisplay();

    if (TogetherJS.running &&
        !hashchangeSignalFromRemote /* don't double send */) {
      console.log("TogetherJS SEND hashchange", appMode);
      TogetherJS.send({type: "hashchange", appMode: appMode});
    }
  });


  $("#executeBtn").attr('disabled', false);
  $("#executeBtn").click(executeCodeFromScratch);

  $("#clearBtn").click(function() {
    pyInputCodeMirror.setValue('');
    $(".surveyQ").val('');
  });


  // canned examples

  $("#tutorialExampleLink").click(function() {
    $.get("example-code/py_tutorial.txt", setCodeMirrorVal);
    return false;
  });

  $("#strtokExampleLink").click(function() {
    $.get("example-code/strtok.txt", setCodeMirrorVal);
    return false;
  });

  $("#listCompLink").click(function() {
    $.get("example-code/list-comp.txt", setCodeMirrorVal);
    return false;
  });

  $("#compsLink").click(function() {
    $.get("example-code/comprehensions.txt", setCodeMirrorVal);
    return false;
  });

  $("#fibonacciExampleLink").click(function() {
    $.get("example-code/fib.txt", setCodeMirrorVal);
    return false;
  });

  $("#memoFibExampleLink").click(function() {
    $.get("example-code/memo_fib.txt", setCodeMirrorVal);
    return false;
  });

  $("#factExampleLink").click(function() {
    $.get("example-code/fact.txt", setCodeMirrorVal);
    return false;
  });

  $("#filterExampleLink").click(function() {
    $.get("example-code/filter.txt", setCodeMirrorVal);
    return false;
  });

  $("#insSortExampleLink").click(function() {
    $.get("example-code/ins_sort.txt", setCodeMirrorVal);
    return false;
  });

  $("#aliasExampleLink").click(function() {
    $.get("example-code/aliasing.txt", setCodeMirrorVal);
    return false;
  });

  $("#happyExampleLink").click(function() {
    $.get("example-code/happy.txt", setCodeMirrorVal);
    return false;
  });

  $("#newtonExampleLink").click(function() {
    $.get("example-code/sqrt.txt", setCodeMirrorVal);
    return false;
  });

  $("#oopSmallExampleLink").click(function() {
    $.get("example-code/oop_small.txt", setCodeMirrorVal);
    return false;
  });

  $("#mapExampleLink").click(function() {
    $.get("example-code/map.txt", setCodeMirrorVal);
    return false;
  });

  $("#rawInputExampleLink").click(function() {
    $.get("example-code/raw_input.txt", setCodeMirrorVal);
    return false;
  });

  $("#oop1ExampleLink").click(function() {
    $.get("example-code/oop_1.txt", setCodeMirrorVal);
    return false;
  });

  $("#oop2ExampleLink").click(function() {
    $.get("example-code/oop_2.txt", setCodeMirrorVal);
    return false;
  });

  $("#inheritanceExampleLink").click(function() {
    $.get("example-code/oop_inherit.txt", setCodeMirrorVal);
    return false;
  });

  $("#sumExampleLink").click(function() {
    $.get("example-code/sum.txt", setCodeMirrorVal);
    return false;
  });

  $("#pwGcdLink").click(function() {
    $.get("example-code/wentworth_gcd.txt", setCodeMirrorVal);
    return false;
  });

  $("#pwSumListLink").click(function() {
    $.get("example-code/wentworth_sumList.txt", setCodeMirrorVal);
    return false;
  });

  $("#towersOfHanoiLink").click(function() {
    $.get("example-code/towers_of_hanoi.txt", setCodeMirrorVal);
    return false;
  });

  $("#pwTryFinallyLink").click(function() {
    $.get("example-code/wentworth_try_finally.txt", setCodeMirrorVal);
    return false;
  });

  $("#sumCubesLink").click(function() {
    $.get("example-code/sum-cubes.txt", setCodeMirrorVal);
    return false;
  });

  $("#decoratorsLink").click(function() {
    $.get("example-code/decorators.txt", setCodeMirrorVal);
    return false;
  });

  $("#genPrimesLink").click(function() {
    $.get("example-code/gen_primes.txt", setCodeMirrorVal);
    return false;
  });

  $("#genExprLink").click(function() {
    $.get("example-code/genexpr.txt", setCodeMirrorVal);
    return false;
  });


  $('#closure1Link').click(function() {
    $.get("example-code/closures/closure1.txt", setCodeMirrorVal);
    return false;
  });
  $('#closure2Link').click(function() {
    $.get("example-code/closures/closure2.txt", setCodeMirrorVal);
    return false;
  });
  $('#closure3Link').click(function() {
    $.get("example-code/closures/closure3.txt", setCodeMirrorVal);
    return false;
  });
  $('#closure4Link').click(function() {
    $.get("example-code/closures/closure4.txt", setCodeMirrorVal);
    return false;
  });
  $('#closure5Link').click(function() {
    $.get("example-code/closures/closure5.txt", setCodeMirrorVal);
    return false;
  });
  $('#lambdaParamLink').click(function() {
    $.get("example-code/closures/lambda-param.txt", setCodeMirrorVal);
    return false;
  });
  $('#tortureLink').click(function() {
    $.get("example-code/closures/student-torture.txt", setCodeMirrorVal);
    return false;
  });



  $('#aliasing1Link').click(function() {
    $.get("example-code/aliasing/aliasing1.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing2Link').click(function() {
    $.get("example-code/aliasing/aliasing2.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing3Link').click(function() {
    $.get("example-code/aliasing/aliasing3.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing4Link').click(function() {
    $.get("example-code/aliasing/aliasing4.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing5Link').click(function() {
    $.get("example-code/aliasing/aliasing5.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing6Link').click(function() {
    $.get("example-code/aliasing/aliasing6.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing7Link').click(function() {
    $.get("example-code/aliasing/aliasing7.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing8Link').click(function() {
    $.get("example-code/aliasing/aliasing8.txt", setCodeMirrorVal);
    return false;
  });


  $('#ll1Link').click(function() {
    $.get("example-code/linked-lists/ll1.txt", setCodeMirrorVal);
    return false;
  });
  $('#ll2Link').click(function() {
    $.get("example-code/linked-lists/ll2.txt", setCodeMirrorVal);
    return false;
  });
  $('#sumListLink').click(function() {
    $.get("example-code/sum-list.txt", setCodeMirrorVal);
    return false;
  });

  $('#varargsLink').click(function() {
    $.get("example-code/varargs.txt", setCodeMirrorVal);
    return false;
  });

  $('#forElseLink').click(function() {
    $.get("example-code/for-else.txt", setCodeMirrorVal);
    return false;
  });

  $('#nonlocalLink').click(function() {
    $.get("example-code/nonlocal.txt", setCodeMirrorVal);
    return false;
  });

  $('#metaclassLink').click(function() {
    $.get("example-code/metaclass.txt", setCodeMirrorVal);
    return false;
  });

  $('#cmFibLink').click(function() {
    $.get("example-code/chris-meyers/optFib.txt", setCodeMirrorVal);
    $("#showOnlyOutputsSelector").val('true');
    return false;
  });

  $('#cmMinPathLink').click(function() {
    $.get("example-code/chris-meyers/optMinpath.txt", setCodeMirrorVal);
    $("#showOnlyOutputsSelector").val('true');
    return false;
  });

  $('#cmKnapsackLink').click(function() {
    $.get("example-code/chris-meyers/optKnapsack.txt", setCodeMirrorVal);
    $("#showOnlyOutputsSelector").val('true');
    return false;
  });

  $('#cmSieveLink').click(function() {
    $.get("example-code/chris-meyers/optSieve.txt", setCodeMirrorVal);
    $("#showOnlyOutputsSelector").val('true');
    return false;
  });


  var queryStrOptions = getQueryStringOptions();
  setToggleOptions(queryStrOptions);

  if (queryStrOptions.preseededCode) {
    setCodeMirrorVal(queryStrOptions.preseededCode);
  }
  else {
    // select a canned example on start-up:
    $("#aliasExampleLink").trigger('click');
  }

  appMode = queryStrOptions.appMode; // assign this to the GLOBAL appMode
  if ((appMode == 'display' || appMode == 'visualize' /* 'visualize' is deprecated */) &&
      queryStrOptions.preseededCode /* jump to display only with pre-seeded code */) {
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
  $(document).ajaxError(function(evt, jqxhr, settings, exception) {
    // ignore errors related to togetherjs stuff:
    if (settings.url.indexOf('togetherjs') > -1) {
      return; // get out early
    }

    alert("Server error (possibly due to memory/resource overload). " +
          "Report a bug to philip@pgbovine.net\n\n" +
          "(Click the 'Generate URL' button to include a unique URL in your email bug report.)");

    $('#executeBtn').html("Visualize Execution");
    $('#executeBtn').attr('disabled', false);
  });


  $(window).resize(redrawConnectors);

  $('#genUrlBtn').bind('click', function() {
    var myArgs = getAppState();
    delete myArgs.visualizedAppState; // no need to put this in the URL
    var urlStr = $.param.fragment(window.location.href, myArgs, 2 /* clobber all */);
    $('#urlOutput').val(urlStr);
  });

  $('#genEmbedBtn').bind('click', function() {
    assert(appMode == 'display' || appMode == 'visualize' /* 'visualize' is deprecated */);
    var myArgs = getAppState();
    delete myArgs.mode;
    delete myArgs.visualizedAppState; // no need to put this in the URL
    myArgs.codeDivWidth = myVisualizer.DEFAULT_EMBEDDED_CODE_DIV_WIDTH;
    myArgs.codeDivHeight = myVisualizer.DEFAULT_EMBEDDED_CODE_DIV_HEIGHT;

    var embedUrlStr = $.param.fragment(domain + "iframe-embed.html", myArgs, 2 /* clobber all */);
    var iframeStr = '<iframe width="800" height="500" frameborder="0" src="' + embedUrlStr + '"> </iframe>';
    $('#embedCodeOutput').val(iframeStr);
  });


  // for survey-related stuff
  $('.surveyBtn').click(function(e) {
    // wow, massive copy-and-paste action from above!
    var myArgs = getAppState();
    delete myArgs.visualizedAppState; // no need to put this in the URL

    var buttonPrompt = $(this).html();
    var res = prompt('"' + buttonPrompt + '"' + '\nPlease elaborate if you can and hit OK to submit:');
    // don't do ajax call when Cancel button is pressed
    // (note that if OK button is pressed with no response, then an
    // empty string will still be sent to the server
    if (res !== null) {
      myArgs.surveyQuestion = buttonPrompt;
      myArgs.surveyResponse = res;
      $.get('survey.py', myArgs, function(dat) {});
    }
  });
});
