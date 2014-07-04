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
// - js/togetherjs/togetherjs-min.js
// should all be imported BEFORE this file


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

  var backendOptionsObj = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
                           heap_primitives: ($('#heapPrimitivesSelector').val() == 'true'),
                           show_only_outputs: ($('#showOnlyOutputsSelector').val() == 'true'),
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

  executePythonCode(pyInputGetValue(),
                    backend_script, backendOptionsObj,
                    frontendOptionsObj,
                    'pyOutputPane',
                    optFinishSuccessfulExecution, handleUncaughtExceptionFunc);
}


$(document).ready(function() {
  setSurveyHTML();

  // for OPT live chat tutoring interface
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


  // canned examples

  $("#tutorialExampleLink").click(function() {
    $.get("example-code/py_tutorial.txt", pyInputSetValue);
    return false;
  });

  $("#strtokExampleLink").click(function() {
    $.get("example-code/strtok.txt", pyInputSetValue);
    return false;
  });

  $("#listCompLink").click(function() {
    $.get("example-code/list-comp.txt", pyInputSetValue);
    return false;
  });

  $("#compsLink").click(function() {
    $.get("example-code/comprehensions.txt", pyInputSetValue);
    return false;
  });

  $("#fibonacciExampleLink").click(function() {
    $.get("example-code/fib.txt", pyInputSetValue);
    return false;
  });

  $("#memoFibExampleLink").click(function() {
    $.get("example-code/memo_fib.txt", pyInputSetValue);
    return false;
  });

  $("#factExampleLink").click(function() {
    $.get("example-code/fact.txt", pyInputSetValue);
    return false;
  });

  $("#filterExampleLink").click(function() {
    $.get("example-code/filter.txt", pyInputSetValue);
    return false;
  });

  $("#insSortExampleLink").click(function() {
    $.get("example-code/ins_sort.txt", pyInputSetValue);
    return false;
  });

  $("#aliasExampleLink,#firstExampleDupLink").click(function() {
    $.get("example-code/aliasing.txt", pyInputSetValue);
    return false;
  });

  $("#happyExampleLink").click(function() {
    $.get("example-code/happy.txt", pyInputSetValue);
    return false;
  });

  $("#newtonExampleLink").click(function() {
    $.get("example-code/sqrt.txt", pyInputSetValue);
    return false;
  });

  $("#oopSmallExampleLink").click(function() {
    $.get("example-code/oop_small.txt", pyInputSetValue);
    return false;
  });

  $("#mapExampleLink").click(function() {
    $.get("example-code/map.txt", pyInputSetValue);
    return false;
  });

  $("#rawInputExampleLink").click(function() {
    $.get("example-code/raw_input.txt", pyInputSetValue);
    return false;
  });

  $("#oop1ExampleLink").click(function() {
    $.get("example-code/oop_1.txt", pyInputSetValue);
    return false;
  });

  $("#oop2ExampleLink").click(function() {
    $.get("example-code/oop_2.txt", pyInputSetValue);
    return false;
  });

  $("#inheritanceExampleLink").click(function() {
    $.get("example-code/oop_inherit.txt", pyInputSetValue);
    return false;
  });

  $("#sumExampleLink").click(function() {
    $.get("example-code/sum.txt", pyInputSetValue);
    return false;
  });

  $("#pwGcdLink").click(function() {
    $.get("example-code/wentworth_gcd.txt", pyInputSetValue);
    return false;
  });

  $("#pwSumListLink").click(function() {
    $.get("example-code/wentworth_sumList.txt", pyInputSetValue);
    return false;
  });

  $("#towersOfHanoiLink").click(function() {
    $.get("example-code/towers_of_hanoi.txt", pyInputSetValue);
    return false;
  });

  $("#pwTryFinallyLink").click(function() {
    $.get("example-code/wentworth_try_finally.txt", pyInputSetValue);
    return false;
  });

  $("#sumCubesLink").click(function() {
    $.get("example-code/sum-cubes.txt", pyInputSetValue);
    return false;
  });

  $("#decoratorsLink").click(function() {
    $.get("example-code/decorators.txt", pyInputSetValue);
    return false;
  });

  $("#genPrimesLink").click(function() {
    $.get("example-code/gen_primes.txt", pyInputSetValue);
    return false;
  });

  $("#genExprLink").click(function() {
    $.get("example-code/genexpr.txt", pyInputSetValue);
    return false;
  });


  $('#closure1Link').click(function() {
    $.get("example-code/closures/closure1.txt", pyInputSetValue);
    return false;
  });
  $('#closure2Link').click(function() {
    $.get("example-code/closures/closure2.txt", pyInputSetValue);
    return false;
  });
  $('#closure3Link').click(function() {
    $.get("example-code/closures/closure3.txt", pyInputSetValue);
    return false;
  });
  $('#closure4Link').click(function() {
    $.get("example-code/closures/closure4.txt", pyInputSetValue);
    return false;
  });
  $('#closure5Link').click(function() {
    $.get("example-code/closures/closure5.txt", pyInputSetValue);
    return false;
  });
  $('#lambdaParamLink').click(function() {
    $.get("example-code/closures/lambda-param.txt", pyInputSetValue);
    return false;
  });
  $('#tortureLink').click(function() {
    $.get("example-code/closures/student-torture.txt", pyInputSetValue);
    return false;
  });



  $('#aliasing1Link').click(function() {
    $.get("example-code/aliasing/aliasing1.txt", pyInputSetValue);
    return false;
  });
  $('#aliasing2Link').click(function() {
    $.get("example-code/aliasing/aliasing2.txt", pyInputSetValue);
    return false;
  });
  $('#aliasing3Link').click(function() {
    $.get("example-code/aliasing/aliasing3.txt", pyInputSetValue);
    return false;
  });
  $('#aliasing4Link').click(function() {
    $.get("example-code/aliasing/aliasing4.txt", pyInputSetValue);
    return false;
  });
  $('#aliasing5Link').click(function() {
    $.get("example-code/aliasing/aliasing5.txt", pyInputSetValue);
    return false;
  });
  $('#aliasing6Link').click(function() {
    $.get("example-code/aliasing/aliasing6.txt", pyInputSetValue);
    return false;
  });
  $('#aliasing7Link').click(function() {
    $.get("example-code/aliasing/aliasing7.txt", pyInputSetValue);
    return false;
  });
  $('#aliasing8Link').click(function() {
    $.get("example-code/aliasing/aliasing8.txt", pyInputSetValue);
    return false;
  });


  $('#ll1Link').click(function() {
    $.get("example-code/linked-lists/ll1.txt", pyInputSetValue);
    return false;
  });
  $('#ll2Link').click(function() {
    $.get("example-code/linked-lists/ll2.txt", pyInputSetValue);
    return false;
  });
  $('#sumListLink').click(function() {
    $.get("example-code/sum-list.txt", pyInputSetValue);
    return false;
  });

  $('#varargsLink').click(function() {
    $.get("example-code/varargs.txt", pyInputSetValue);
    return false;
  });

  $('#forElseLink').click(function() {
    $.get("example-code/for-else.txt", pyInputSetValue);
    return false;
  });

  $('#nonlocalLink').click(function() {
    $.get("example-code/nonlocal.txt", pyInputSetValue);
    return false;
  });

  $('#metaclassLink').click(function() {
    $.get("example-code/metaclass.txt", pyInputSetValue);
    return false;
  });

  $('#cmFibLink').click(function() {
    $.get("example-code/chris-meyers/optFib.txt", pyInputSetValue);
    $("#showOnlyOutputsSelector").val('true');
    return false;
  });

  $('#cmMinPathLink').click(function() {
    $.get("example-code/chris-meyers/optMinpath.txt", pyInputSetValue);
    $("#showOnlyOutputsSelector").val('true');
    return false;
  });

  $('#cmKnapsackLink').click(function() {
    $.get("example-code/chris-meyers/optKnapsack.txt", pyInputSetValue);
    $("#showOnlyOutputsSelector").val('true');
    return false;
  });

  $('#cmSieveLink').click(function() {
    $.get("example-code/chris-meyers/optSieve.txt", pyInputSetValue);
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

  genericOptFrontendReady(); // initialize at the end
});
