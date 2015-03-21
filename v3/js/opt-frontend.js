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


// TODO: combine and minify with https://github.com/mishoo/UglifyJS2
// and add version numbering using a ?-style query string to prevent
// caching snafus


// Pre-reqs:
// - pytutor.js
// - jquery.ba-bbq.min.js
// - jquery.ba-dotimeout.min.js // for event debouncing: http://benalman.com/code/projects/jquery-dotimeout/examples/debouncing/
// - opt-frontend-common.js
// - js/togetherjs/togetherjs-min.js
// should all be imported BEFORE this file


// NASTY GLOBALS for socket.io!
var reconnectAttempts = 0;
var logEventQueue = []; // TODO: make sure this doesn't grow too large if socketio isn't enabled


var originFrontendJsFile = 'opt-frontend.js';

// for OPT live chat tutoring interface
var tutorRequested = false;
var helpQueueSize = 0;
var tutorAvailable = false;
var tutorWaitText = 'Please wait for the next available tutor.';

function setHelpQueueSizeLabel() {
  if (helpQueueSize == 1) {
    $("#helpQueueText").html('There is 1 person in line.');
  }
  else if (helpQueueSize == 0 || helpQueueSize > 1) {
    $("#helpQueueText").html('There are ' + helpQueueSize + ' people in line.');
  }
}

function requestTutor() {
  $("#getTutorBtn,#sharedSessionBtn,#surveyHeader").hide(); // hide ASAP!
  $("#togetherjsStatus").html("Please wait ... requesting a tutor");
  tutorRequested = true;
  TogetherJS();
}

function startSharedSession() { // override default
  $("#getTutorBtn,#sharedSessionBtn,#surveyHeader").hide(); // hide ASAP!
  $("#togetherjsStatus").html("Please wait ... loading shared session");
  tutorRequested = false;
  TogetherJS();
}


function TogetherjsReadyHandler() {
  $("#getTutorBtn,#surveyHeader").hide();

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
    populateTogetherJsShareUrl();
  }
}

function TogetherjsCloseHandler() {
  if (tutorAvailable) {
    $("#getTutorBtn").show();
  }

  if (appMode == "display") {
    $("#surveyHeader").show();
  }
}


function executeCode(forceStartingInstr, forceRawInputLst) {
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
  else if ($('#pythonVersionSelector').val() == 'js') {
      backend_script = js_backend_script;
  }
  else if ($('#pythonVersionSelector').val() == 'ts') {
      backend_script = ts_backend_script;
  }
  else if ($('#pythonVersionSelector').val() == 'java') {
      backend_script = java_backend_script;
  }
  assert(backend_script);

  var backendOptionsObj = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
                           heap_primitives: ($('#heapPrimitivesSelector').val() == 'true'),
                           show_only_outputs: false,
                           py_crazy_mode: ($('#pythonVersionSelector').val() == '2crazy'),
                           origin: originFrontendJsFile};

  var surveyObj = getSurveyObject();
  if (surveyObj) {
    backendOptionsObj.survey = surveyObj;
  }

  var startingInstruction = forceStartingInstr ? forceStartingInstr : 0;

  var frontendOptionsObj = {startingInstruction: startingInstruction,
                            // tricky: selector 'true' and 'false' values are strings!
                            disableHeapNesting: ($('#heapPrimitivesSelector').val() == 'true'),
                            textualMemoryLabels: ($('#textualMemoryLabelsSelector').val() == 'true'),
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

  executePythonCode(pyInputGetValue(),
                    backend_script, backendOptionsObj,
                    frontendOptionsObj,
                    'pyOutputPane',
                    optFinishSuccessfulExecution, handleUncaughtExceptionFunc);
}


function initAceAndOptions() {
  if ($('#pythonVersionSelector').val() === 'java') {
    $("#javaOptionsPane").show();
  } else {
    $("#javaOptionsPane").hide();
  }
  setAceMode(); // update syntax highlighting mode
}


var JS_EXAMPLES = {
  jsFactExLink: 'js-example-code/fact.js',
  jsDatatypesExLink: 'js-example-code/data-types.js',
  jsExceptionExLink: 'js-example-code/caught-exception.js',
  jsClosureExLink: 'js-example-code/closure1.js',
  jsShadowingExLink: 'js-example-code/var-shadowing2.js',
  jsConstructorExLink: 'js-example-code/constructor.js',
  jsInhExLink: 'js-example-code/inheritance.js',
};

var TS_EXAMPLES = {
  tsHelloExLink: 'ts-example-code/hello.ts',
  tsGreeterExLink: 'ts-example-code/greeter.ts',
  tsGreeterGenericsExLink: 'ts-example-code/greeter-generics.ts',
  tsInheritanceExLink: 'ts-example-code/inheritance.ts',
};

var JAVA_EXAMPLES = {
  javaVarLink: 'java-example-code/Variables.java',
  javaCFLink: 'java-example-code/ControlFlow.java',
  javaSqrtLink: 'java-example-code/Sqrt.java',
  javaExecLimitLink: 'java-example-code/ExecLimit.java',
  javaStringsLink: 'java-example-code/Strings.java',

  javaPassByValLink: 'java-example-code/PassByValue.java',
  javaRecurLink: 'java-example-code/Recursion.java',
  javaSOLink: 'java-example-code/StackOverflow.java',

  javaRolexLink: 'java-example-code/Rolex.java',
  javaPersonLink: 'java-example-code/Person.java',
  javaComplexLink: 'java-example-code/Complex.java',
  javaCastingLink: 'java-example-code/Casting.java',

  javaLLLink: 'java-example-code/LinkedList.java',
  javaStackQueueLink: 'java-example-code/StackQueue.java',
  javaPostfixLink: 'java-example-code/Postfix.java',
  javaSTLink: 'java-example-code/SymbolTable.java',

  javaToStringLink: 'java-example-code/ToString.java',
  javaReflectLink: 'java-example-code/Reflect.java',
  javaExceptionLink: 'java-example-code/Exception.java',
  javaExceptionFlowLink: 'java-example-code/ExceptionFlow.java',
  javaTwoClassesLink: 'java-example-code/TwoClasses.java',

  javaForestLink: 'java-example-code/Forest.java',
  javaKnapsackLink: 'java-example-code/Knapsack.java',
  javaStaticInitLink: 'java-example-code/StaticInitializer.java',
  javaSyntheticLink: 'java-example-code/Synthetic.java',
};

var PY2_EXAMPLES = {
  tutorialExampleLink: "example-code/py_tutorial.txt",
  strtokExampleLink: "example-code/strtok.txt",
  listCompLink: "example-code/list-comp.txt",
  compsLink: "example-code/comprehensions.txt",
  fibonacciExampleLink: "example-code/fib.txt",
  memoFibExampleLink: "example-code/memo_fib.txt",
  factExampleLink: "example-code/fact.txt",
  filterExampleLink: "example-code/filter.txt",
  insSortExampleLink: "example-code/ins_sort.txt",
  aliasExampleLink: "example-code/aliasing.txt",
  happyExampleLink: "example-code/happy.txt",
  newtonExampleLink: "example-code/sqrt.txt",
  oopSmallExampleLink: "example-code/oop_small.txt",
  mapExampleLink: "example-code/map.txt",
  rawInputExampleLink: "example-code/raw_input.txt",
  oop1ExampleLink: "example-code/oop_1.txt",
  oop2ExampleLink: "example-code/oop_2.txt",
  inheritanceExampleLink: "example-code/oop_inherit.txt",
  sumExampleLink: "example-code/sum.txt",
  pwGcdLink: "example-code/wentworth_gcd.txt",
  pwSumListLink: "example-code/wentworth_sumList.txt",
  towersOfHanoiLink: "example-code/towers_of_hanoi.txt",
  pwTryFinallyLink: "example-code/wentworth_try_finally.txt",
  sumCubesLink: "example-code/sum-cubes.txt",
  decoratorsLink: "example-code/decorators.txt",
  genPrimesLink: "example-code/gen_primes.txt",
  genExprLink: "example-code/genexpr.txt",
  closure1Link: "example-code/closures/closure1.txt",
  closure2Link: "example-code/closures/closure2.txt",
  closure3Link: "example-code/closures/closure3.txt",
  closure4Link: "example-code/closures/closure4.txt",
  closure5Link: "example-code/closures/closure5.txt",
  lambdaParamLink: "example-code/closures/lambda-param.txt",
  aliasing1Link: "example-code/aliasing/aliasing1.txt",
  aliasing2Link: "example-code/aliasing/aliasing2.txt",
  aliasing3Link: "example-code/aliasing/aliasing3.txt",
  aliasing4Link: "example-code/aliasing/aliasing4.txt",
  aliasing5Link: "example-code/aliasing/aliasing5.txt",
  aliasing6Link: "example-code/aliasing/aliasing6.txt",
  aliasing7Link: "example-code/aliasing/aliasing7.txt",
  aliasing8Link: "example-code/aliasing/aliasing8.txt",
  ll1Link: "example-code/linked-lists/ll1.txt",
  ll2Link: "example-code/linked-lists/ll2.txt",
  sumListLink: "example-code/sum-list.txt",
  varargsLink: "example-code/varargs.txt",
  forElseLink: "example-code/for-else.txt",
  metaclassLink: "example-code/metaclass.txt",
}

var PY3_EXAMPLES = {
  tortureLink: "example-code/closures/student-torture.txt",
  nonlocalLink: "example-code/nonlocal.txt",
}

var chatBox = undefined;
function createChatBox() {
  assert(!chatBox);
  chatBox = $("#chat_div").chatbox({id: "Me",
                                    user: {key : "value"},
                                    title: "Live Chat With Tutor",
                                    width: 250,
                                    offset: 2, // offset from right edge
                                    messageSent: chatMsgSent,
                                    boxClosed: chatBoxClosed,
                                    chatboxToggled: chatBoxToggled,
                                  });
}

function chatMsgSent(id, user, msg) {
  $("#chat_div").chatbox("option", "boxManager").addMsg(id, msg);
  logEvent({type: 'opt-client-chat', text: msg, sid: loggingSocketIO ? loggingSocketIO.id : undefined});
}

// only called when the user hits the X button to explicitly close the chat box
function chatBoxClosed(id) {
  logEvent({type: 'opt-client-chat', text: '[closed chat box]', sid: loggingSocketIO ? loggingSocketIO.id : undefined});
}

// called when the user toggles the chat box open or close
function chatBoxToggled(visible) {
  var msg = '[minimized chat box]';
  if (visible) {
    msg = '[maximized chat box]';
  }
  logEvent({type: 'opt-client-chat', text: msg, sid: loggingSocketIO ? loggingSocketIO.id : undefined});
}

$(document).ready(function() {
  setSurveyHTML();

  // for OPT live chat tutoring interface -- DEPRECATED FOR NOW
  /*
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
  */


  // canned examples
  $(".exampleLink").click(function() {
    var myId = $(this).attr('id');
    var exFile;
    var lang;
    if (JS_EXAMPLES[myId] !== undefined) {
      exFile = JS_EXAMPLES[myId];
      lang = 'js';
    } else if (TS_EXAMPLES[myId] !== undefined) {
      exFile = TS_EXAMPLES[myId];
      lang = 'ts';
    } else if (JAVA_EXAMPLES[myId] !== undefined) {
      exFile = JAVA_EXAMPLES[myId];
      lang = 'java';
    } else if (PY2_EXAMPLES[myId] !== undefined) {
      exFile = PY2_EXAMPLES[myId];

      // only switch Python mode to 2 if we're not on '2' or '3'; otherwise
      // leave as-is so as not to rock the boat
      if ($('#pythonVersionSelector').val() !== '2' &&
          $('#pythonVersionSelector').val() !== '3') {
        lang = '2';
      }
    } else {
      exFile = PY3_EXAMPLES[myId];
      assert(exFile !== undefined);
      lang = '3';
    }


    if (lang) {
      $('#pythonVersionSelector').val(lang);
    }

    $.get(exFile, function(dat) {
      pyInputSetValue(dat);
      initAceAndOptions();

      // very subtle! for TogetherJS to sync #pythonVersionSelector
      // properly, we must manually send a sync request event:
      if (TogetherJS && TogetherJS.running) {
        TogetherJS.send({type: "syncAppState",
                         myAppState: getAppState(),
                         codeInputScrollTop: pyInputGetScrollTop(),
                         pyCodeOutputDivScrollTop: myVisualizer ?
                                                   myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop() :
                                                   undefined});
      }

    }, 'text' /* data type - set to text or else jQuery tries to EXECUTE the JS example code! */);
    return false; // prevent 'a' click from going to an actual link
  });
  $('#pythonVersionSelector').change(initAceAndOptions);


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

  genericOptFrontendReady(); // initialize at the end


  // deployed on 2015-03-12, taken down on 2015-03-16
  //$("#surveyHeader").html('<a href="http://45.56.123.166/~mgordon/OnlinePythonTutor/v3/embedding-demo.html?session=fvkqv4423mcxr" target="_blank">Click here to help our research</a> by collaboratively annotating<br/>a piece of Python code to create a tutorial for beginners.');
  //$("#surveyHeader").css('font-size', '12pt');

  // run this AFTER genericOptFrontendReady so that opt_uuid is already
  // set by now
  var myUuid = supports_html5_storage() ? localStorage.getItem('opt_uuid') : '';
  // deployed on 2015-03-19, added opt_uuid param on 2015-03-20
  $("#surveyHeader")
    .html('<iframe width="820" height="120" frameborder="0" src="http://45.56.123.166/~mgordon/OnlinePythonTutor/v3/embedding-demo-blur-frame.html?opt_uuid=' + myUuid + '"></iframe>')
    .css('margin-bottom', '10px');


  initAceAndOptions(); // do this after genericOptFrontendReady

  // connect on-demand in logEvent(), not here
  //loggingSocketIO = io('http://104.237.139.253:5000/userlog'); // PRODUCTION_PORT
  //loggingSocketIO = io('http://104.237.139.253:5001/userlog'); // DEBUG_PORT


  if (loggingSocketIO) {
    loggingSocketIO.on('connect', function() {
      //console.log('CONNECTED and emitting', logEventQueue.length, 'events');

      if (logEventQueue.length > 0) {
        // the reconnectAttempts field that denotes how many times you've
        // attempted to reconnect (which is also how many times you've
        // been kicked off by the logging server for, say, being idle).
        // add this as an extra field on the FIRST event
        if (reconnectAttempts > 0) {
          logEventQueue[0].reconnectAttempts = reconnectAttempts;
        }

        while (logEventQueue.length > 0) {
          loggingSocketIO.emit('opt-client-event', logEventQueue.pop());
        }
      }
      assert(logEventQueue.length === 0);

      reconnectAttempts++;
    });

    loggingSocketIO.on('opt-codeopticon-observer-chat', function(msg) {
      if (!chatBox) {
        createChatBox();
      } else {
        $("#chat_div").chatbox("option", "hidden", false);
        $("#chat_div").chatbox("showContent");
      }

      $("#chat_div").chatbox("option", "boxManager").addMsg('Tutor', msg.text);
    });
  }
});
