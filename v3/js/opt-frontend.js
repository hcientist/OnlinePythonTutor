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
// - jquery.ba-dotimeout.min.js // for event debouncing: http://benalman.com/code/projects/jquery-dotimeout/examples/debouncing/
// - opt-frontend-common.js
// should all be imported BEFORE this file


var enableTogetherJS = true; // EXPERIMENTAL

var TogetherJSConfig_disableWebRTC = true;
var TogetherJSConfig_suppressJoinConfirmation = true;
var TogetherJSConfig_dontShowClicks = false;

// stop popping up boring intro dialog box:
var TogetherJSConfig_seenIntroDialog = true;

// suppress annoying pop-ups:
var TogetherJSConfig_suppressInvite = true;
var TogetherJSConfig_suppressJoinConfirmation = true;

// clone clicks ONLY in certain elements to keep things simple:
//var TogetherJSConfig_cloneClicks = '#pyInputPane select,#pyInputPane #executeBtn';
var TogetherJSConfig_cloneClicks = '#pyInputPane select';

var TogetherJSConfig_siteName = "Online Python Tutor live help";
var TogetherJSConfig_toolName = "Online Python Tutor live help";

//var TogetherJSConfig_hubBase = "http://184.173.101.176:30035/"; // online
var TogetherJSConfig_hubBase = "http://localhost:30035/"; // local

var tutorRequested = false;

var helpQueueSize = 0;
var tutorAvailable = false;

// TODO: consider deferred initialization later: "TogetherJS starts up
// automatically as soon as it can, especially when continuing a
// session. Sometimes this is problematic, like an application that
// bootstraps all of its UI after page load. To defer this
// initialization, define a function TogetherJSConfig_callToStart like:"
//TogetherJSConfig_callToStart = function (callback) {
//};

var origDocURL = document.URL; // capture this ASAP before TogetherJS munges the URL

var tutorWaitText = 'Please wait for the next available tutor.';
var informedConsentText = '<div style="color: #666;">During shared sessions, chat logs and code may be recorded and published for<br/>educational purposes. Do not reveal any private or confidential information.</div>';

// nasty globals
var updateOutputSignalFromRemote = false;
var executeCodeSignalFromRemote = false;
var codeMirrorWarningTimeoutId = undefined;
var pendingCodeOutputScrollTop = null;

var codeMirrorScroller = '#codeInputPane .CodeMirror-scroll';


// Global hook for ExecutionVisualizer.
var try_hook = function(hook_name, args) {
  return [false]; // just a stub
}


function requestSync() {
  if (TogetherJS.running) {
    TogetherJS.send({type: "requestSync"});
  }
}

function syncAppState(appState) {
  setToggleOptions(appState);

  // VERY VERY subtle -- temporarily prevent TogetherJS from sending
  // form update events while we set the code mirror value. otherwise
  // this will send an incorrect delta to the other end and screw things
  // up because the initial states of the two forms aren't equal.
  var orig = TogetherJS.config.get('ignoreForms');
  TogetherJS.config('ignoreForms', true);
  setCodeMirrorVal(appState.code);
  TogetherJS.config('ignoreForms', orig);

  if (appState.rawInputLst) {
    rawInputLst = $.parseJSON(appState.rawInputLstJSON);
  }
  else {
    rawInputLst = [];
  }
}


function requestTutor() {
  tutorRequested = true;
  TogetherJS();
}

function startSharedSession() {
  tutorRequested = false;
  TogetherJS();
}

function setHelpQueueSizeLabel() {
  if (helpQueueSize == 1) {
    $("#helpQueueText").html('There is 1 person in line.');
  }
  else if (helpQueueSize == 0 || helpQueueSize > 1) {
    $("#helpQueueText").html('There are ' + helpQueueSize + ' people in line.');
  }
}


// get this app ready for TogetherJS
function initTogetherJS() {
  // This event triggers when you first join a session and say 'hello',
  // and then one of your peers says hello back to you. If they have the
  // exact same name as you, then change your own name to avoid ambiguity.
  // Remember, they were here first (that's why they're saying 'hello-back'),
  // so they keep their own name, but you need to change yours :)
  TogetherJS.hub.on("togetherjs.hello-back", function(msg) {
    if (!msg.sameUrl) {
      return;
    }

    var p = TogetherJS.require("peers");

    var peerNames = p.getAllPeers().map(function(e) {return e.name});
    //console.warn('togetherjs.hello-back', msg.name, peerNames);

    if (msg.name == p.Self.name) {
      var newName = undefined;
      var toks = msg.name.split(' ');
      var count = Number(toks[1]);

      // make sure the name is truly unique, incrementing count as necessary
      do {
        if (!isNaN(count)) {
          newName = toks[0] + ' ' + String(count + 1); // e.g., "Tutor 3"
          count++;
        }
        else {
          // the original name was something like "Tutor", so make
          // newName into, say, "Tutor 2"
          newName = p.Self.name + ' 2';
          count = 2;
        }
      } while ($.inArray(newName, peerNames) >= 0); // i.e., is newName in peerNames?

      p.Self.update({name: newName}); // change our own name
    }
  });

  // Global hook for ExecutionVisualizer.
  // Set it here after TogetherJS gets defined, hopefully!
  try_hook = function(hook_name, args) {
    if (hook_name == "end_updateOutput") {
      if (updateOutputSignalFromRemote) {
        return;
      }
      if (TogetherJS.running && !isExecutingCode) {
        TogetherJS.send({type: "updateOutput", step: args.myViz.curInstr});
      }

      // 2014-05-25: implemented more detailed tracing for surveys
      if (args.myViz.creationTime) {
        var deltaMs = (new Date()) - args.myViz.creationTime;

        var uh = args.myViz.updateHistory;
        assert(uh.length > 0); // should already be seeded with an initial value
        var lastDeltaMs = uh[uh.length - 1][1];

        // ("debounce" entries that are less than 1 second apart to
        // compress the logs a bit when there's rapid scrubbing or scrolling)
        if ((deltaMs - lastDeltaMs) < 1000) {
          uh.pop(); // get rid of last entry before pushing a new entry
        }
        uh.push([args.myViz.curInstr, deltaMs]);
        //console.log(JSON.stringify(uh));
      }
    }
    return [false];
  }

  TogetherJS.hub.on("updateOutput", function(msg) {
    if (!msg.sameUrl) {
      return;
    }
    if (isExecutingCode) {
      return;
    }

    if (myVisualizer) {
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

  TogetherJS.hub.on("executeCode", function(msg) {
    if (!msg.sameUrl) {
      return;
    }
    if (isExecutingCode) {
      return;
    }

    executeCodeSignalFromRemote = true;
    try {
      executeCode(msg.forceStartingInstr, msg.rawInputLst);
    }
    finally {
      executeCodeSignalFromRemote = false;
    }

  });

  TogetherJS.hub.on("hashchange", function(msg) {
    if (!msg.sameUrl) {
      return;
    }
    if (isExecutingCode) {
      return;
    }

    console.log("TogetherJS RECEIVE hashchange", msg.appMode);
    if (msg.appMode != appMode) {
      updateAppDisplay(msg.appMode);

      if (appMode == 'edit' && msg.codeInputScrollTop !== undefined &&
          $(codeMirrorScroller).scrollTop() != msg.codeInputScrollTop) {
        // hack: give it a bit of time to settle first ...
        $.doTimeout('pyInputCodeMirrorInit', 200, function() {
          $(codeMirrorScroller).scrollTop(msg.codeInputScrollTop);
        });
      }
    }
  });

  TogetherJS.hub.on("codemirror-edit", function(msg) {
    if (!msg.sameUrl) {
      return;
    }

    if (codeMirrorWarningTimeoutId !== undefined) {
      clearTimeout(codeMirrorWarningTimeoutId); // don't let these events pile up
    }

    $("#codeInputWarnings").html('<span style="color: #e93f34; font-weight: bold">\
                                  Hold on, someone else is typing ...</span>');
    codeMirrorWarningTimeoutId = setTimeout(function() {
      $("#codeInputWarnings").html('Write your Python code here:');
    }, 1000);
  });

  TogetherJS.hub.on("requestSync", function(msg) {
    if (TogetherJS.running) {
      TogetherJS.send({type: "myAppState",
                       myAppState: getAppState(),
                       codeInputScrollTop: $('#codeInputPane .CodeMirror-scroll').scrollTop(),
                       pyCodeOutputDivScrollTop: myVisualizer ?
                                                 myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop() :
                                                 undefined});
    }
  });

  TogetherJS.hub.on("myAppState", function(msg) {
    var learnerAppState = msg.myAppState;

    if (learnerAppState.mode == 'display') {
      if (appStateEq(getAppState(), learnerAppState)) {
        // update curInstr only
        console.log("on:myAppState - app states equal, renderStep", learnerAppState.curInstr);
        myVisualizer.renderStep(learnerAppState.curInstr);

        if (msg.pyCodeOutputDivScrollTop !== undefined) {
          myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(msg.pyCodeOutputDivScrollTop);
        }
      }
      else {
        console.log("on:myAppState - app states unequal, executing", learnerAppState);
        syncAppState(learnerAppState);

        executeCodeSignalFromRemote = true;
        try {
          if (msg.pyCodeOutputDivScrollTop !== undefined) {
            pendingCodeOutputScrollTop = msg.pyCodeOutputDivScrollTop; // NASTY global
          }
          executeCode(learnerAppState.curInstr);
        }
        finally {
          executeCodeSignalFromRemote = false;
        }
      }
    }
    else {
      if (!appStateEq(getAppState(), learnerAppState)) {
        console.log("on:myAppState - edit mode sync");
        syncAppState(learnerAppState);
        enterEditMode();
      }
    }

    if (msg.codeInputScrollTop !== undefined) {
      // give pyInputCodeMirror a bit of time to settle with its new
      // value. this is hacky; ideally we have a callback function for
      // when setValue() completes.
      $.doTimeout('pyInputCodeMirrorInit', 200, function() {
        $(codeMirrorScroller).scrollTop(msg.codeInputScrollTop);
      });
    }
  });

  TogetherJS.hub.on("codeInputScroll", function(msg) {
    if (!msg.sameUrl) {
      return;
    }
    $(codeMirrorScroller).scrollTop(msg.scrollTop);
  });

  TogetherJS.hub.on("pyCodeOutputDivScroll", function(msg) {
    if (!msg.sameUrl) {
      return;
    }
    if (myVisualizer) {
      myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(msg.scrollTop);
    }
  });

  try {
    var source = new EventSource(TogetherJSConfig_hubBase + 'learner-SSE');
    source.onmessage = function(e) {
      var dat = JSON.parse(e.data);

      // nasty globals
      helpQueueSize = dat.helpQueueUrls;
      tutorAvailable = dat.helpAvailable;

      setHelpQueueSizeLabel();

      if (tutorAvailable && !TogetherJS.running) {
        $("#getTutorBtn").fadeIn(750, redrawConnectors);
      }
      else {
        $("#getTutorBtn").fadeOut(750, redrawConnectors);
      }
    };
  }
  catch(err) {
    // ugh, SSE doesn't seem to work in Safari
    console.warn("Sad ... EventSource not supported :(");
  }

  $("#getTutorBtn").click(requestTutor);
  $("#sharedSessionBtn").click(startSharedSession);
  $("#stopTogetherJSBtn").click(TogetherJS); // toggles off

  // fired when TogetherJS is activated. might fire on page load if there's
  // already an open session from a prior page load in the recent past.
  TogetherJS.on("ready", function () {
    console.log("TogetherJS ready");
    $("#getTutorBtn,#sharedSessionBtn").hide();
    $("#surveyHeader").hide();
    $("#stopTogetherJSBtn").show();

    // without anything after the '#' in the hash
    var cleanUrl = $.param.fragment(location.href, {}, 2 /* override */);
    var urlToShare = cleanUrl + 'togetherjs=' + TogetherJS.shareId();

    requestSync(); // immediately try to sync upon startup so that if
                   // others are already in the session, we will be
                   // synced up. and if nobody is here, then this is a NOP.

    if (tutorRequested) {
      $.get(TogetherJSConfig_hubBase + 'request-help',
            {url: TogetherJS.shareUrl(), id: TogetherJS.shareId()},
            null /* don't use a callback; rely on SSE */);

      $("#togetherjsStatus").html('<div style="font-size: 11pt; margin-bottom: 5pt;">\
                                   Please wait for the next available tutor. \
                                   <span id="helpQueueText"></span></div>');
      setHelpQueueSizeLabel(); // run after creating span#helpQueueText
    }
    else {
      $("#togetherjsStatus").html('<div>\
                                   Copy and send this URL to let others join your session:\
                                   </div>\
                                   <input type="text" style="font-size: 12pt; \
                                   font-weight: bold; padding: 5px;\
                                   margin-bottom: 10pt;" \
                                   id="togetherjsURL" size="80" readonly="readonly"/>');
      $("#togetherjsURL").val(urlToShare).attr('size', urlToShare.length + 15);
    }

    $("#togetherjsStatus").append(informedConsentText).fadeIn(500);
  });

  // emitted when TogetherJS is closed. This is not emitted when the
  // page simply closes or navigates elsewhere. It is only closed when
  // TogetherJS is specifically stopped.
  TogetherJS.on("close", function () {
    console.log("TogetherJS close");

    $("#stopTogetherJSBtn,#togetherjsStatus").hide();
    $("#sharedSessionBtn").show();

    if (tutorAvailable) {
      $("#getTutorBtn").show();
    }

    if (appMode == "display") {
      $("#surveyHeader").show();
    }
  });
}


// also fires a TogetherJS "executeCode" signal if enabled
function executeCode(forceStartingInstr, forceRawInputLst) {
  console.log('executeCode', forceStartingInstr, forceRawInputLst);

  if (forceRawInputLst !== undefined) {
    rawInputLst = forceRawInputLst; // UGLY global across modules, FIXME
  }

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

  var backendOptionsObj = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
                           heap_primitives: ($('#heapPrimitivesSelector').val() == 'true'),
                           show_only_outputs: ($('#showOnlyOutputsSelector').val() == 'true'),
                           py_crazy_mode: ($('#pythonVersionSelector').val() == '2crazy'),
                           origin: 'opt-frontend.js'};

  var surveyObj = getSurveyObject();
  if (surveyObj) {
    backendOptionsObj.survey = surveyObj;
  }

  var startingInstruction = forceStartingInstr ? forceStartingInstr : 0;

  var frontendOptionsObj = {startingInstruction: startingInstruction,
                            // tricky: selector 'true' and 'false' values are strings!
                            disableHeapNesting: ($('#heapPrimitivesSelector').val() == 'true'),
                            drawParentPointers: ($('#drawParentPointerSelector').val() == 'true'),
                            textualMemoryLabels: ($('#textualMemoryLabelsSelector').val() == 'true'),
                            showOnlyOutputs: ($('#showOnlyOutputsSelector').val() == 'true'),
                            executeCodeWithRawInputFunc: executeCodeWithRawInput,

                            // always use the same visualizer ID for all
                            // instantiated ExecutionVisualizer objects,
                            // so that they can sync properly across
                            // multiple clients using TogetherJS. this
                            // shouldn't lead to problems since only ONE
                            // ExecutionVisualizer will be shown at a time
                            visualizerIdOverride: '1',
                            updateOutputCallback: function() {$('#urlOutput,#embedCodeOutput').val('');},

                            // undocumented experimental modes:
                            pyCrazyMode: ($('#pythonVersionSelector').val() == '2crazy'),
                            holisticMode: ($('#cumulativeModeSelector').val() == 'holistic')
                           }

  if (TogetherJS.running && !executeCodeSignalFromRemote) {
    TogetherJS.send({type: "executeCode",
                     myAppState: getAppState(),
                     forceStartingInstr: forceStartingInstr,
                     rawInputLst: rawInputLst});
  }

  executePythonCode(pyInputCodeMirror.getValue(),
                    backend_script, backendOptionsObj,
                    frontendOptionsObj,
                    'pyOutputPane',
                    optFinishSuccessfulExecution, handleUncaughtExceptionFunc);
}


function optFinishSuccessfulExecution() {
  enterDisplayMode(); // do this first!

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
      if (TogetherJS.running) {
        // (there's no easy way to prevent this), but it shouldn't keep
        // bouncing back and forth indefinitely since no the second signal
        // causes no additional scrolling
        TogetherJS.send({type: "pyCodeOutputDivScroll",
                         scrollTop: elt.scrollTop()});
      }
    });
  });

  // 2014-05-25: implemented more detailed tracing for surveys
  myVisualizer.creationTime = new Date();
  // each element will be a two-element list consisting of:
  // [step number, milliseconds elapsed since creationTime]
  // ("debounce" entries that are less than 1 second apart to
  // compress the logs a bit when there's rapid scrubbing or scrolling)
  myVisualizer.updateHistory = [];
  myVisualizer.updateHistory.push([myVisualizer.curInstr, 0]); // seed it!
}


$(document).ready(function() {
  setSurveyHTML();

  if (enableTogetherJS) {
    initTogetherJS();
  }


  // be friendly to the browser's forward and back buttons
  // thanks to http://benalman.com/projects/jquery-bbq-plugin/
  $(window).bind("hashchange", function(e) {
    var newMode = $.bbq.getState('mode');
    console.log('hashchange:', newMode);
    updateAppDisplay(newMode);

    if (TogetherJS.running && !isExecutingCode) {
      TogetherJS.send({type: "hashchange",
                       appMode: appMode,
                       codeInputScrollTop: $(codeMirrorScroller).scrollTop(),
                       myAppState: getAppState()});
    }
  });


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


  $('#genEmbedBtn').bind('click', function() {
    assert(appMode == 'display' || appMode == 'visualize' /* 'visualize' is deprecated */);
    var myArgs = getAppState();
    delete myArgs.mode;
    myArgs.codeDivWidth = myVisualizer.DEFAULT_EMBEDDED_CODE_DIV_WIDTH;
    myArgs.codeDivHeight = myVisualizer.DEFAULT_EMBEDDED_CODE_DIV_HEIGHT;

    var embedUrlStr = $.param.fragment(domain + "iframe-embed.html", myArgs, 2 /* clobber all */);
    var iframeStr = '<iframe width="800" height="500" frameborder="0" src="' + embedUrlStr + '"> </iframe>';
    $('#embedCodeOutput').val(iframeStr);
  });


  // for survey-related stuff
  // (Version 1 - started running this experiment on 2014-04-09 and put
  // it on hold on 2014-05-02)

  $('.surveyBtn').click(function(e) {
    // wow, massive copy-and-paste action from above!
    var myArgs = getAppState();

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

  // for survey-related stuff
  // (Version 2 - started running on 2014-05-24)
  $('#iJustLearnedSubmission').click(function(e) {
    var resp = $("#iJustLearnedInput").val();

    if (!$.trim(resp)) {
      return;
    }

    // wow, massive copy-and-paste action from above!
    var myArgs = getAppState();

    myArgs.surveyQuestion = "I just learned that ...";
    myArgs.surveyResponse = resp;
    myArgs.surveyVersion = 'v2';

    // 2014-05-25: implemented more detailed tracing for surveys
    if (myVisualizer) {
      myArgs.updateHistoryJSON = JSON.stringify(myVisualizer.updateHistory);
    }

    $.get('survey.py', myArgs, function(dat) {});

    $("#iJustLearnedInput").val('');
    $("#iJustLearnedThanks").show();
    $.doTimeout('iJustLearnedThanksFadeOut', 1200, function() {
      $("#iJustLearnedThanks").fadeOut(1000);
    });
  });

  genericOptFrontendReady(); // initialize at the end

  pyInputCodeMirror.on("change", function(cm, change) {
    // only trigger when the user explicitly typed something
    if (change.origin != 'setValue') {
      if (TogetherJS.running) {
        TogetherJS.send({type: "codemirror-edit"});
      }
    }
  });

  $('#codeInputPane .CodeMirror-scroll').scroll(function(e) {
    if (TogetherJS.running) {
      var elt = $(this);
      // debounce
      $.doTimeout('codeInputScroll', 100, function() {
        // note that this will send a signal back and forth both ways
        // (there's no easy way to prevent this), but it shouldn't keep
        // bouncing back and forth indefinitely since no the second signal
        // causes no additional scrolling
        TogetherJS.send({type: "codeInputScroll",
                         scrollTop: elt.scrollTop()});
      });
    }
  });
});
