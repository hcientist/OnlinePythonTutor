// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

// TODOs:
// qtip doesn't work with Webpack, so experimentalPopUpSyntaxErrorSurvey DOESN'T WORK
// deactivate it for now
var activateSyntaxErrorSurvey = false; // true;
// a list of previous consecutive executions with "compile"-time exceptions
var prevExecutionExceptionObjLst = [];


// use Webpack to automatically package up these dependencies
require('./jquery-3.0.0.min.js');
require('./jquery.qtip.min.js');
require('../css/jquery.qtip.css');

// just punt and use global script dependencies
require("script!./ace/src-min-noconflict/ace.js");
require('script!./ace/src-min-noconflict/mode-python.js');
require('script!./ace/src-min-noconflict/mode-javascript.js');
require('script!./ace/src-min-noconflict/mode-typescript.js');
require('script!./ace/src-min-noconflict/mode-c_cpp.js');
require('script!./ace/src-min-noconflict/mode-java.js');
require('script!./ace/src-min-noconflict/mode-ruby.js');

require('script!./socket.io-client/socket.io.js');


var optCommon = require('./opt-frontend-common.ts');
var pytutor = require('./pytutor.ts');
var assert = pytutor.assert;

var optTests = require('./opt-testcases.ts');

require('../css/opt-frontend.css');

// TODO: add Codeopticon dependencies later


var originFrontendJsFile = 'opt-frontend.js';


function startSharedSession() { // override default
  $("#ssDiv,#surveyHeader").hide(); // hide ASAP!
  $("#adHeader").hide(); // hide ASAP!
  $("#togetherjsStatus").html("Please wait ... loading shared session");
  TogetherJS();
}


function TogetherjsReadyHandler() {
  $("#surveyHeader").hide();
  optCommon.populateTogetherJsShareUrl();
}

function TogetherjsCloseHandler() {
  if (optCommon.getAppMode() == "display") {
    $("#surveyHeader").show();
  }
}

function executeCode(forceStartingInstr, forceRawInputLst) {
  if (forceRawInputLst !== undefined) {
    optCommon.setRawInputLst(forceRawInputLst); // UGLY global across modules, FIXME
  }

  var backend_script = optCommon.langToBackendScript($('#pythonVersionSelector').val());
  var backendOptionsObj = optCommon.getBaseBackendOptionsObj();

  var startingInstruction = forceStartingInstr ? forceStartingInstr : 0;

  var frontendOptionsObj = optCommon.getBaseFrontendOptionsObj();
  frontendOptionsObj.startingInstruction = startingInstruction;

  optCommon.executeCodeAndCreateViz(optCommon.pyInputGetValue(),
                          backend_script, backendOptionsObj,
                          frontendOptionsObj,
                          'pyOutputPane',
                          optFrontendFinishSuccessfulExecution,
                          optFrontendHandleUncaughtException);
}

function optFrontendFinishSuccessfulExecution() {
  optCommon.optFinishSuccessfulExecution();

  if (typeof(activateSyntaxErrorSurvey) !== 'undefined' &&
      activateSyntaxErrorSurvey &&
      experimentalPopUpSyntaxErrorSurvey) {
    experimentalPopUpSyntaxErrorSurvey();
  }
}

function optFrontendHandleUncaughtException(trace) {
  optCommon.handleUncaughtExceptionFunc(trace);

  var killerException = null;

  if (trace.length == 1) {
    killerException = trace[0]; // killer!
  }
  else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
    killerException = trace[trace.length - 1]; // killer!
  }

  if (killerException) {
    var excObj = {killerException: killerException, myAppState: optCommon.getAppState()};
    prevExecutionExceptionObjLst.push(excObj);
  } else {
    prevExecutionExceptionObjLst = []; // reset!!!
  }
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
    var curState = optCommon.getAppState();
    if (prevExecutionExceptionObj.myAppState.py != curState.py) {
      return;
    }

    // make sure jquery.qtip has been imported
    var myVisualizer = optCommon.getVisualizer();

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
      $(bub.hashID).qtip($.extend({}, pytutor.qtipShared, {
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

      var myUuid = optCommon.supports_html5_storage() ? localStorage.getItem('opt_uuid') : '';

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
        var resObj = {appState: optCommon.getAppState(),
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
        var resObj = {appState: optCommon.getAppState(),
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
        var resObj = {appState: optCommon.getAppState(),
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
      $("#syntaxErrMsg").html(pytutor.htmlspecialchars(prevExecutionExceptionObj.killerException.exception_msg));

      bub.redrawCodelineBubble(); // do an initial redraw to align everything

      //globalBub = bub; // for debugging

      // log an event whenever this bubble is show (i.e., an 'impression')
      // NB: it might actually be hidden if it appears on a line that
      // isn't initially visible to the user, but whatevers ...
      var impressionObj = {appState: optCommon.getAppState(),
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
  optCommon.setAceMode(); // update syntax highlighting mode

  if (v === 'js' || v === '2' || v === '3') {
    $("#liveModeBtn").show();
  } else {
    $("#liveModeBtn").hide();
  }
}


var JS_EXAMPLES = {
  jsFactExLink: 'fact.js',
  jsDatatypesExLink: 'data-types.js',
  jsExceptionExLink: 'caught-exception.js',
  jsClosureExLink: 'closure1.js',
  jsShadowingExLink: 'var-shadowing2.js',
  jsConstructorExLink: 'constructor.js',
  jsInhExLink: 'inheritance.js',
};

var TS_EXAMPLES = {
  tsHelloExLink: 'hello.ts',
  tsGreeterExLink: 'greeter.ts',
  tsGreeterGenericsExLink: 'greeter-generics.ts',
  tsInheritanceExLink: 'inheritance.ts',
};

var JAVA_EXAMPLES = {
  javaVarLink: 'Variables.java',
  javaCFLink: 'ControlFlow.java',
  javaSqrtLink: 'Sqrt.java',
  javaExecLimitLink: 'ExecLimit.java',
  javaStringsLink: 'Strings.java',

  javaPassByValLink: 'PassByValue.java',
  javaRecurLink: 'Recursion.java',
  javaSOLink: 'StackOverflow.java',

  javaRolexLink: 'Rolex.java',
  javaPersonLink: 'Person.java',
  javaComplexLink: 'Complex.java',
  javaCastingLink: 'Casting.java',

  javaLLLink: 'LinkedList.java',
  javaStackQueueLink: 'StackQueue.java',
  javaPostfixLink: 'Postfix.java',
  javaSTLink: 'SymbolTable.java',

  javaToStringLink: 'ToString.java',
  javaReflectLink: 'Reflect.java',
  javaExceptionLink: 'Exception.java',
  javaExceptionFlowLink: 'ExceptionFlow.java',
  javaTwoClassesLink: 'TwoClasses.java',

  javaForestLink: 'Forest.java',
  javaKnapsackLink: 'Knapsack.java',
  javaStaticInitLink: 'StaticInitializer.java',
  javaSyntheticLink: 'Synthetic.java',
};

var PY2_EXAMPLES = {
  tutorialExampleLink: "py_tutorial.txt",
  strtokExampleLink: "strtok.txt",
  listCompLink: "list-comp.txt",
  compsLink: "comprehensions.txt",
  fibonacciExampleLink: "fib.txt",
  memoFibExampleLink: "memo_fib.txt",
  factExampleLink: "fact.txt",
  filterExampleLink: "filter.txt",
  insSortExampleLink: "ins_sort.txt",
  aliasExampleLink: "aliasing.txt",
  happyExampleLink: "happy.txt",
  newtonExampleLink: "sqrt.txt",
  oopSmallExampleLink: "oop_small.txt",
  mapExampleLink: "map.txt",
  rawInputExampleLink: "raw_input.txt",
  oop1ExampleLink: "oop_1.txt",
  oop2ExampleLink: "oop_2.txt",
  inheritanceExampleLink: "oop_inherit.txt",
  sumExampleLink: "sum.txt",
  pwGcdLink: "wentworth_gcd.txt",
  pwSumListLink: "wentworth_sumList.txt",
  towersOfHanoiLink: "towers_of_hanoi.txt",
  pwTryFinallyLink: "wentworth_try_finally.txt",
  sumCubesLink: "sum-cubes.txt",
  decoratorsLink: "decorators.txt",
  genPrimesLink: "gen_primes.txt",
  genExprLink: "genexpr.txt",
  closure1Link: "closures/closure1.txt",
  closure2Link: "closures/closure2.txt",
  closure3Link: "closures/closure3.txt",
  closure4Link: "closures/closure4.txt",
  closure5Link: "closures/closure5.txt",
  lambdaParamLink: "closures/lambda-param.txt",
  aliasing1Link: "aliasing/aliasing1.txt",
  aliasing2Link: "aliasing/aliasing2.txt",
  aliasing3Link: "aliasing/aliasing3.txt",
  aliasing4Link: "aliasing/aliasing4.txt",
  aliasing5Link: "aliasing/aliasing5.txt",
  aliasing6Link: "aliasing/aliasing6.txt",
  aliasing7Link: "aliasing/aliasing7.txt",
  aliasing8Link: "aliasing/aliasing8.txt",
  ll1Link: "linked-lists/ll1.txt",
  ll2Link: "linked-lists/ll2.txt",
  sumListLink: "sum-list.txt",
  varargsLink: "varargs.txt",
  forElseLink: "for-else.txt",
  metaclassLink: "metaclass.txt",
}

var PY3_EXAMPLES = {
  tortureLink: "closures/student-torture.txt",
  nonlocalLink: "nonlocal.txt",
}

var RUBY_EXAMPLES = {
  rubyBlocksLink: 'blocks-basic.rb',
  rubyBlocksScopingLink: 'blocks-scoping-2.rb',
  rubyInheritanceLink: 'class-inheritance.rb',
  rubyConstantsLink: 'constants-4.rb',
  rubyContainersLink: 'container-data-types.rb',
  rubyGlobalsLink: 'globals.rb',
  rubyLambdaScopingLink: 'lambda-scoping-2.rb',
  rubyMegagreeterLink: 'megagreeter.rb',
  rubyProcLink: 'proc-basic.rb',
  rubyProcScopingLink: 'proc-scoping.rb',
  rubySymbolsLink: 'symbols.rb',
  rubyPrivateProtectedLink: 'class-private-protected.rb',
  rubyInstClassVarsComplexLink: 'inst-class-vars-complex.rb',
  rubyToplevelLink: 'toplevel-inst-class-vars.rb',
  rubyBlocksScoping3Link: 'blocks-scoping-3.rb',
  rubyProcReturnLink: 'proc-return.rb',
};

var C_EXAMPLES = {
  cArrOverflowLink: 'array-overflow.c',
  cArrParamLink: 'array-param.c',
  cNestedStructLink: 'fjalar-NestedStructTest.c',
  cPtrLevelsLink: 'fjalar-pointer-levels.c',
  //cStringArraysLink: 'fjalar-string-arrays.c',
  cGlobalsLink: 'globals.c',
  cMengThesisLink: 'meng-thesis-example.c',
  cPtrChainLink: 'pointer-chain.c',
  cPtrWildLink: 'pointers-gone-wild.c',
  cStringRevLink: 'string-reverse-inplace.c',
  cStructLink: 'struct-basic.c',
  cTypedefLink: 'typedef-test.c',
}

var CPP_EXAMPLES = {
  cppClassLink: 'cpp-class-basic.cpp',
  cppDateLink: 'cpp-class-date.cpp',
  cppClassPtrLink: 'cpp-class-pointers.cpp',
  cppFirstLink: 'cpp-first.cpp',
  cppInheritLink: 'cpp-inheritance.cpp',
  cppPassRefLink: 'cpp-pass-by-ref.cpp',
  cppVirtualLink: 'cpp-virtual-method.cpp',
}


$(document).ready(function() {
  optCommon.setSurveyHTML();

  $("#hideHeaderLink").click(function() {
    $("#experimentalHeader").hide();
    var myVisualizer = optCommon.getVisualizer();
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
      if ($('#pythonVersionSelector').val() === '3') {
        lang = '3';
      } else {
        lang = '2';
      }
    } else {
      exFile = PY3_EXAMPLES[myId];
      assert(exFile !== undefined);
      lang = '3';
    }
    assert(lang);
    $('#pythonVersionSelector').val(lang);

    if (lang === '2' || lang === '3') {
      exFile = 'example-code/python/' + exFile;
    } else {
      exFile = 'example-code/' + lang + '/' + exFile;
    }

    $.get(exFile, function(dat) {
      optCommon.pyInputSetValue(dat);
      initAceAndOptions();

      // very subtle! for TogetherJS to sync #pythonVersionSelector
      // properly, we must manually send a sync request event:
      if (TogetherJS && TogetherJS.running) {
        var myVisualizer = optCommon.getVisualizer();
        TogetherJS.send({type: "syncAppState",
                         myAppState: optCommon.getAppState(),
                         codeInputScrollTop: optCommon.pyInputGetScrollTop(),
                         pyCodeOutputDivScrollTop: myVisualizer ?
                                                   myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop() :
                                                   undefined});
      }

    }, 'text' /* data type - set to text or else jQuery tries to EXECUTE the JS example code! */);
    return false; // prevent 'a' click from going to an actual link
  });
  $('#pythonVersionSelector').change(initAceAndOptions);


  $('#genEmbedBtn').bind('click', function() {
    assert(optCommon.getAppMode() == 'display' || optCommon.getAppMode() == 'visualize' /* 'visualize' is deprecated */);
    var myArgs = optCommon.getAppState();
    delete myArgs.mode;
    var myVisualizer = optCommon.getVisualizer();
    myArgs.codeDivWidth = myVisualizer.DEFAULT_EMBEDDED_CODE_DIV_WIDTH;
    myArgs.codeDivHeight = myVisualizer.DEFAULT_EMBEDDED_CODE_DIV_HEIGHT;

    var domain = "http://pythontutor.com/"; // for deployment
    var embedUrlStr = $.param.fragment(domain + "iframe-embed.html", myArgs, 2 /* clobber all */);
    embedUrlStr = embedUrlStr.replace(/\)/g, '%29') // replace ) with %29 so that links embed well in Markdown
    var iframeStr = '<iframe width="800" height="500" frameborder="0" src="' + embedUrlStr + '"> </iframe>';
    $('#embedCodeOutput').val(iframeStr);
  });

  optCommon.genericOptFrontendReady({originFrontendJsFile: originFrontendJsFile,
                                     executeCode: executeCode,
                                     TogetherjsReadyHandler: TogetherjsReadyHandler,
                                     TogetherjsCloseHandler: TogetherjsCloseHandler,
                                    }); // initialize at the end


  // deployed on 2015-03-12, taken down on 2015-03-16
  //$("#surveyHeader").html('<a href="http://45.56.123.166/~mgordon/OnlinePythonTutor/v3/embedding-demo.html?session=fvkqv4423mcxr" target="_blank">Click here to help our research</a> by collaboratively annotating<br/>a piece of Python code to create a tutorial for beginners.');
  //$("#surveyHeader").css('font-size', '12pt');

  // run this AFTER genericOptFrontendReady so that opt_uuid is already
  // set by now
  var myUuid = optCommon.supports_html5_storage() ? localStorage.getItem('opt_uuid') : '';
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
    optTests.initTestcasesPane('#testCasesPane');
    $(this).hide();
    return false;
  });

  $("#liveModeBtn").click(function() {
    var myArgs = optCommon.getAppState();
    var urlStr = $.param.fragment('live.html', myArgs, 2 /* clobber all */);
    window.open(urlStr); // open in new tab
  });
});
