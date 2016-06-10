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


var originFrontendJsFile = 'opt-frontend.js';

var activateSyntaxErrorSurvey = true; // true;

function startSharedSession() { // override default
  $("#ssDiv,#surveyHeader").hide(); // hide ASAP!
  $("#adHeader").hide(); // hide ASAP!
  $("#togetherjsStatus").html("Please wait ... loading shared session");
  TogetherJS();
}


function TogetherjsReadyHandler() {
  $("#surveyHeader").hide();
  populateTogetherJsShareUrl();
}

function TogetherjsCloseHandler() {
  if (appMode == "display") {
    $("#surveyHeader").show();
  }
}

function getBaseBackendOptionsObj() {
  var ret = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
             heap_primitives: ($('#heapPrimitivesSelector').val() == 'true'),
             show_only_outputs: false,
             py_crazy_mode: ($('#pythonVersionSelector').val() == '2crazy'),
             origin: originFrontendJsFile};

  var surveyObj = getSurveyObject();
  if (surveyObj) {
    ret.survey = surveyObj;
  }

  return ret;
}

function getBaseFrontendOptionsObj() {
  var ret = {// tricky: selector 'true' and 'false' values are strings!
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
            };
  return ret;
}

function executeCode(forceStartingInstr, forceRawInputLst) {
  if (forceRawInputLst !== undefined) {
    rawInputLst = forceRawInputLst; // UGLY global across modules, FIXME
  }

  var backend_script = langToBackendScript($('#pythonVersionSelector').val());
  var backendOptionsObj = getBaseBackendOptionsObj();

  var startingInstruction = forceStartingInstr ? forceStartingInstr : 0;

  var frontendOptionsObj = getBaseFrontendOptionsObj();
  frontendOptionsObj.startingInstruction = startingInstruction;

  executeCodeAndCreateViz(pyInputGetValue(),
                          backend_script, backendOptionsObj,
                          frontendOptionsObj,
                          'pyOutputPane',
                          optFinishSuccessfulExecution, handleUncaughtExceptionFunc);
}


// domID is the ID of the element to attach to (without the leading '#' sign)
function SyntaxErrorSurveyBubble(parentViz, domID) {
  this.parentViz = parentViz;

  this.domID = domID;
  this.hashID = '#' + domID;

  this.my = 'left center';
  this.at = 'right center';

  this.qtipHidden = false; // is there a qtip object present but hidden? (TODO: kinda confusing)
}

SyntaxErrorSurveyBubble.prototype.destroyQTip = function() {
  $(this.hashID).qtip('destroy');
}

SyntaxErrorSurveyBubble.prototype.redrawCodelineBubble = function() {
  if (isOutputLineVisibleForBubbles(this.domID)) {
    if (this.qtipHidden) {
      $(this.hashID).qtip('show');
    }
    else {
      $(this.hashID).qtip('reposition');
    }

    this.qtipHidden = false;
  }
  else {
    $(this.hashID).qtip('hide');
    this.qtipHidden = true;
  }
}

SyntaxErrorSurveyBubble.prototype.qTipContentID = function() {
  return '#ui-tooltip-' + this.domID + '-content';
}

SyntaxErrorSurveyBubble.prototype.qTipID = function() {
  return '#ui-tooltip-' + this.domID;
}


// created on 2015-04-18
function experimentalPopUpSyntaxErrorSurvey() {
  if (prevExecutionExceptionObjLst.length > 0) {
    // work with the most recent entry
    var prevExecutionExceptionObj = prevExecutionExceptionObjLst[prevExecutionExceptionObjLst.length - 1];
    var offendingLine = prevExecutionExceptionObj.killerException.line;

    if (offendingLine === undefined) {
      return; // get out early!
    }

    // if we've switched languages between the previous error and this
    // run, then DON'T pop up a survey since the point is moot anyhow;
    // there's no point in asking the question when the language has
    // changed :)
    var curState = getAppState();
    if (prevExecutionExceptionObj.myAppState.py != curState.py) {
      return;
    }

    // make sure jquery.qtip has been imported

    var codelineIDs = [];
    $.each(myVisualizer.domRoot.find('#pyCodeOutput .cod'), function(i, e) {
      // hacky!
      var domID = $(e).attr('id');
      var lineRE = new RegExp('cod' + String(offendingLine) + '$'); // $ for end-of-line match
      if (lineRE.test(domID)) {
        codelineIDs.push($(e).attr('id'));
      }
    });

    // should find only 1 match, or else something is wonky, maybe
    // because the code changed so much that the line number in question
    // is no longer available
    if (codelineIDs.length === 1) {
      var codLineId = codelineIDs[0];

      var bub = new SyntaxErrorSurveyBubble(myVisualizer, codLineId);

      // if pyCodeOutputDiv is narrower than the current line, then
      // adjust the x position of the pop-up bubble accordingly to be
      // flush with the right of pyCodeOutputDiv
      var pcodWidth = myVisualizer.domRoot.find('#pyCodeOutputDiv').width();
      var codLineWidth = myVisualizer.domRoot.find('#' + codLineId).parent().width(); // get enclosing 'tr'
      var adjustX = 0; // default

      // actually nix this for now to keep things simple ...
      //if (pcodWidth < codLineWidth) {
      //  adjustX = pcodWidth - codLineWidth; // should be negative!
      //}

      // destroy then create a new tip:
      bub.destroyQTip();
      $(bub.hashID).qtip($.extend({}, qtipShared, {
        content: ' ', // can't be empty!
        id: bub.domID,
        position: {
          my: bub.my,
          at: bub.at,
          adjust: {
            x: adjustX,
          },
          effect: null, // disable all cutesy animations
        },
        style: {
          classes: 'ui-tooltip-pgbootstrap ui-tooltip-pgbootstrap-RED'
        }
      }));

      // need to set both max-width and width() ...
      $(bub.qTipID()).css('max-width', '350px').width('350px');

      var myUuid = supports_html5_storage() ? localStorage.getItem('opt_uuid') : '';

      // Wording of the survey bubble:
      /*
      var version = 'v1'; // deployed on 2015-04-19, revoked on 2015-04-20
      var surveyBubbleHTML = '<div id="syntaxErrBubbleContents">\
                                <div id="syntaxErrHeader">You just fixed the following error:</div>\
                                <div id="syntaxErrCodeDisplay"></div>\
                                <div id="syntaxErrMsg"></div>\
                                <div id="syntaxErrQuestion">\
                                   If you think this message wasn\'t helpful, what would have been the best error message for you here?<br/>\
                                   <input type="text" id="syntaxErrTxtInput" size=60 maxlength=150/><br/>\
                                   <button id="syntaxErrSubmitBtn" type="button">Submit</button>\
                                   <button id="syntaxErrCloseBtn" type="button">Close</button>\
                                </div>\
                              </div>'
      */

      /*
      var version = 'v2'; // deployed on 2015-04-20, revoked on 2015-09-08
      var surveyBubbleHTML = '<div id="syntaxErrBubbleContents">\
                                <div id="syntaxErrHeader">You just fixed the following error:</div>\
                                <div id="syntaxErrCodeDisplay"></div>\
                                <div id="syntaxErrMsg"></div>\
                                <div id="syntaxErrQuestion">\
                                   If you think this message wasn\'t helpful, what would have been the best error message for you here?<br/>\
                                   <input type="text" id="syntaxErrTxtInput" size=60 maxlength=150/><br/>\
                                   <button id="syntaxErrSubmitBtn" type="button">Submit</button>\
                                   <button id="syntaxErrCloseBtn" type="button">Close</button>\
                                   <a href="#" id="syntaxErrHideAllLink">Hide all pop-ups</a>\
                                </div>\
                              </div>'
      */

      var version = 'v3'; // deployed on 2015-09-08
      var surveyBubbleHTML = '<div id="syntaxErrBubbleContents">\
                                <div id="syntaxErrHeader">You just fixed the following error:</div>\
                                <div id="syntaxErrCodeDisplay"></div>\
                                <div id="syntaxErrMsg"></div>\
                                <div id="syntaxErrQuestion">\
                                  Please help us improve error messages for future users.\
                                   If you think the above message wasn\'t helpful, what would have been the best message for you here?<br/>\
                                   <input type="text" id="syntaxErrTxtInput" size=60 maxlength=150/><br/>\
                                   <button id="syntaxErrSubmitBtn" type="button">Submit</button>\
                                   <button id="syntaxErrCloseBtn" type="button">Close</button>\
                                   <a href="#" id="syntaxErrHideAllLink">Hide all of these pop-ups</a>\
                                </div>\
                              </div>'


      $(bub.qTipContentID()).html(surveyBubbleHTML);

      // unbind first, then bind a new one
      myVisualizer.domRoot.find('#pyCodeOutputDiv')
        .unbind('scroll')
        .scroll(function() {
          bub.redrawCodelineBubble();
        });

      $(bub.qTipContentID() + ' #syntaxErrSubmitBtn').click(function() {
        var res = $(bub.qTipContentID() + ' #syntaxErrTxtInput').val();
        var resObj = {appState: getAppState(),
                      exc: prevExecutionExceptionObj, // note that prevExecutionExceptionObjLst is BLOWN AWAY by now
                      opt_uuid: myUuid,
                      reply: res,
                      type: 'submit',
                      v: version};

        //console.log(resObj);
        $.get('syntax_err_survey.py', {arg: JSON.stringify(resObj)}, function(dat) {});

        bub.destroyQTip();
      });

      $(bub.qTipContentID() + ' #syntaxErrCloseBtn').click(function() {
        // grab the value anyways in case the learner wrote something decent ...
        var res = $(bub.qTipContentID() + ' #syntaxErrTxtInput').val();
        var resObj = {appState: getAppState(),
                      exc: prevExecutionExceptionObj, // note that prevExecutionExceptionObjLst is BLOWN AWAY by now
                      opt_uuid: myUuid,
                      reply: res,
                      type: 'close',
                      v: version};

        //console.log(resObj);
        $.get('syntax_err_survey.py', {arg: JSON.stringify(resObj)}, function(dat) {});

        bub.destroyQTip();
      });

      $(bub.qTipContentID() + ' #syntaxErrHideAllLink').click(function() {
        // grab the value anyways in case the learner wrote something decent ...
        var res = $(bub.qTipContentID() + ' #syntaxErrTxtInput').val();
        var resObj = {appState: getAppState(),
                      exc: prevExecutionExceptionObj, // note that prevExecutionExceptionObjLst is BLOWN AWAY by now
                      opt_uuid: myUuid,
                      reply: res,
                      type: 'killall',
                      v: version};

        activateSyntaxErrorSurvey = false; // global!

        //console.log(resObj);
        $.get('syntax_err_survey.py', {arg: JSON.stringify(resObj)}, function(dat) {});

        bub.destroyQTip();

        return false; // otherwise the 'a href' will trigger a page reload, ergh!
      });


      var bubbleAceEditor = ace.edit('syntaxErrCodeDisplay');
      // set the size and value ASAP to get alignment working well ...
      bubbleAceEditor.setOptions({minLines: 1, maxLines: 5}); // keep this SMALL
      bubbleAceEditor.setValue(prevExecutionExceptionObj.myAppState.code.rtrim() /* kill trailing spaces */,
                               -1 /* do NOT select after setting text */);

      var s = bubbleAceEditor.getSession();
      // tab -> 4 spaces
      s.setTabSize(4);
      s.setUseSoftTabs(true);
      // disable extraneous indicators:
      s.setFoldStyle('manual'); // no code folding indicators
      s.getDocument().setNewLineMode('unix'); // canonicalize all newlines to unix format
      bubbleAceEditor.setHighlightActiveLine(false);
      bubbleAceEditor.setShowPrintMargin(false);
      bubbleAceEditor.setBehavioursEnabled(false);
      bubbleAceEditor.setFontSize(10);
      bubbleAceEditor.$blockScrolling = Infinity; // kludgy to shut up weird warnings

      $('#syntaxErrCodeDisplay').css('width', '320px');
      $('#syntaxErrCodeDisplay').css('height', '90px'); // VERY IMPORTANT so that it works on I.E., ugh!

      // don't do real-time syntax checks:
      // https://github.com/ajaxorg/ace/wiki/Syntax-validation
      s.setOption("useWorker", false);

      var lang = prevExecutionExceptionObj.myAppState.py;
      var mod = 'python';
      if (lang === 'java') {
        mod = 'java';
      } else if (lang === 'js') {
        mod = 'javascript';
      } else if (lang === 'ts') {
        mod = 'typescript';
      } else if (lang === 'ruby') {
        mod = 'ruby';
      } else if (lang === 'c' || lang === 'cpp') {
        mod = 'c_cpp';
      }
      s.setMode("ace/mode/" + mod);

      bubbleAceEditor.setReadOnly(true);

      s.setAnnotations([{row: offendingLine - 1 /* zero-indexed */,
                         type: 'error',
                         text: prevExecutionExceptionObj.killerException.exception_msg}]);

      // scroll down to the line where the error occurred, trying to center it
      // by subtracing 3 from it (which should center it, assuming we're
      // displaying 5 lines of context)
      if ((offendingLine - 3) > 0) {
        bubbleAceEditor.scrollToLine(offendingLine - 3);
      }

      // don't forget htmlspecialchars
      $("#syntaxErrMsg").html(htmlspecialchars(prevExecutionExceptionObj.killerException.exception_msg));

      bub.redrawCodelineBubble(); // do an initial redraw to align everything

      //globalBub = bub; // for debugging

      // log an event whenever this bubble is show (i.e., an 'impression')
      // NB: it might actually be hidden if it appears on a line that
      // isn't initially visible to the user, but whatevers ...
      var impressionObj = {appState: getAppState(),
                           exceptionLst: prevExecutionExceptionObjLst,
                           opt_uuid: myUuid,
                           type: 'show',
                           v: version};
      //console.log(impressionObj);
      $.get('syntax_err_survey.py', {arg: JSON.stringify(impressionObj)}, function(dat) {});
    }
  }
}


function initAceAndOptions() {
  var v = $('#pythonVersionSelector').val();
  if (v === 'java') {
    $("#javaOptionsPane").show();
  } else {
    $("#javaOptionsPane").hide();
  }
  setAceMode(); // update syntax highlighting mode

  if (v === 'js' || v === '2' || v === '3') {
    $("#liveModeBtn").show();
  } else {
    $("#liveModeBtn").hide();
  }
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

var RUBY_EXAMPLES = {
  rubyBlocksLink: 'ruby-example-code/blocks-basic.rb',
  rubyBlocksScopingLink: 'ruby-example-code/blocks-scoping-2.rb',
  rubyInheritanceLink: 'ruby-example-code/class-inheritance.rb',
  rubyConstantsLink: 'ruby-example-code/constants-4.rb',
  rubyContainersLink: 'ruby-example-code/container-data-types.rb',
  rubyGlobalsLink: 'ruby-example-code/globals.rb',
  rubyLambdaScopingLink: 'ruby-example-code/lambda-scoping-2.rb',
  rubyMegagreeterLink: 'ruby-example-code/megagreeter.rb',
  rubyProcLink: 'ruby-example-code/proc-basic.rb',
  rubyProcScopingLink: 'ruby-example-code/proc-scoping.rb',
  rubySymbolsLink: 'ruby-example-code/symbols.rb',
  rubyPrivateProtectedLink: 'ruby-example-code/class-private-protected.rb',
  rubyInstClassVarsComplexLink: 'ruby-example-code/inst-class-vars-complex.rb',
  rubyToplevelLink: 'ruby-example-code/toplevel-inst-class-vars.rb',
  rubyBlocksScoping3Link: 'ruby-example-code/blocks-scoping-3.rb',
  rubyProcReturnLink: 'ruby-example-code/proc-return.rb',
};

var C_EXAMPLES = {
  cArrOverflowLink: 'c-example-code/array-overflow.c',
  cArrParamLink: 'c-example-code/array-param.c',
  cNestedStructLink: 'c-example-code/fjalar-NestedStructTest.c',
  cPtrLevelsLink: 'c-example-code/fjalar-pointer-levels.c',
  //cStringArraysLink: 'c-example-code/fjalar-string-arrays.c',
  cGlobalsLink: 'c-example-code/globals.c',
  cMengThesisLink: 'c-example-code/meng-thesis-example.c',
  cPtrChainLink: 'c-example-code/pointer-chain.c',
  cPtrWildLink: 'c-example-code/pointers-gone-wild.c',
  cStringRevLink: 'c-example-code/string-reverse-inplace.c',
  cStructLink: 'c-example-code/struct-basic.c',
  cTypedefLink: 'c-example-code/typedef-test.c',
}

var CPP_EXAMPLES = {
  cppClassLink: 'cpp-example-code/cpp-class-basic.cpp',
  cppDateLink: 'cpp-example-code/cpp-class-date.cpp',
  cppClassPtrLink: 'cpp-example-code/cpp-class-pointers.cpp',
  cppFirstLink: 'cpp-example-code/cpp-first.cpp',
  cppInheritLink: 'cpp-example-code/cpp-inheritance.cpp',
  cppPassRefLink: 'cpp-example-code/cpp-pass-by-ref.cpp',
  cppVirtualLink: 'cpp-example-code/cpp-virtual-method.cpp',
}


$(document).ready(function() {
  setSurveyHTML();

  $("#hideHeaderLink").click(function() {
    $("#experimentalHeader").hide();
    if (myVisualizer) {
      myVisualizer.updateOutput(); // redraw arrows
    }
    return false; // don't reload da page
  });

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
    } else if (RUBY_EXAMPLES[myId] !== undefined) {
      exFile = RUBY_EXAMPLES[myId];
      lang = 'ruby';
    } else if (C_EXAMPLES[myId] !== undefined) {
      exFile = C_EXAMPLES[myId];
      lang = 'c';
    } else if (CPP_EXAMPLES[myId] !== undefined) {
      exFile = CPP_EXAMPLES[myId];
      lang = 'cpp';
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
    embedUrlStr = embedUrlStr.replace(/\)/g, '%29') // replace ) with %29 so that links embed well in Markdown
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
  // taken down on 2015-05-14
  //$("#surveyHeader")
  //  .html('<iframe width="820" height="120" frameborder="0" src="http://45.56.123.166/~mgordon/OnlinePythonTutor/v3/embedding-demo-blur-frame.html?opt_uuid=' + myUuid + '"></iframe>')
  //  .css('margin-bottom', '10px');


  initAceAndOptions(); // do this after genericOptFrontendReady

  if (typeof initCodeopticon !== "undefined") {
    initCodeopticon(); // defined in codeopticon-learner.js
  }

  $("#createTestsLink").click(function() {
    initTestcasesPane('#testCasesPane');
    $(this).hide();
    return false;
  });

  $("#liveModeBtn").click(function() {
    var myArgs = getAppState();
    var urlStr = $.param.fragment('live.html', myArgs, 2 /* clobber all */);
    window.open(urlStr); // open in new tab
  });
});
