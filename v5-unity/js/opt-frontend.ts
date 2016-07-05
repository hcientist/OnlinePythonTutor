// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

/* TODO:

- parse Java viz_options in users' java code:
  https://github.com/daveagp/java_visualize/blob/1489078712310eda44391f09405e0f71b2b190c9/jv-frontend.js#L101

  - implement other missing Java functionality while i'm at it :0
    - also implement these options and stdin support too:
      var optionNames = ['showStringsAsObjects', 'showAllFields', 'disableNesting'];

  [probably do this in the FRONTEND and not in pytutor.js]

- qtip doesn't work with Webpack, so experimentalPopUpSyntaxErrorSurvey
  DOESN'T WORK deactivate it for now
  - reinstate SyntaxErrorSurveyBubble later from cruft/syntax-error-bubble.js

    require('./lib/jquery.qtip.min.js');
    require('../css/jquery.qtip.css');

*/


// for TypeScript
declare var initCodeopticon: any; // FIX later when porting Codeopticon

require('./lib/jquery-3.0.0.min.js');
require('./lib/jquery.qtip.min.js');
require('../css/jquery.qtip.css');

// just punt and use global script dependencies
require("script!./lib/ace/src-min-noconflict/ace.js");
require('script!./lib/ace/src-min-noconflict/mode-python.js');
require('script!./lib/ace/src-min-noconflict/mode-javascript.js');
require('script!./lib/ace/src-min-noconflict/mode-typescript.js');
require('script!./lib/ace/src-min-noconflict/mode-c_cpp.js');
require('script!./lib/ace/src-min-noconflict/mode-java.js');
require('script!./lib/ace/src-min-noconflict/mode-ruby.js');

require('script!./lib/socket.io-client/socket.io.js');

// need to directly import the class for typechecking to work
import {AbstractBaseFrontend} from './opt-frontend-common.ts';

var pytutor = require('./pytutor.ts');
var assert = pytutor.assert;

var optTests = require('./opt-testcases.ts');

require('../css/opt-frontend.css');

// TODO: add Codeopticon dependencies later

var optFrontend; // singleton OptFrontend object

// a list of previous consecutive executions with "compile"-time exceptions
var prevExecutionExceptionObjLst = [];

// TODO: reinstate shared session stuff later
var TogetherJS; // temporary stent
/*
function optFrontendStartSharedSession() { // override default
  $("#ssDiv,#surveyHeader").hide(); // hide ASAP!
  $("#adHeader").hide(); // hide ASAP!
  $("#togetherjsStatus").html("Please wait ... loading shared session");
  TogetherJS();
}

function optFrontendTogetherjsReadyHandler() {
  $("#surveyHeader").hide();
  optCommon.populateTogetherJsShareUrl();
}

function optFrontendTogetherjsCloseHandler() {
  if (optCommon.getAppMode() == "display") {
    $("#surveyHeader").show();
  }
}
*/

function initAceAndOptions() {
  var v = $('#pythonVersionSelector').val();
  if (v === 'java') {
    $("#javaOptionsPane").show();
  } else {
    $("#javaOptionsPane").hide();
  }
  optFrontend.setAceMode(); // update syntax highlighting mode

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
};

var CPP_EXAMPLES = {
  cppClassLink: 'cpp-class-basic.cpp',
  cppDateLink: 'cpp-class-date.cpp',
  cppClassPtrLink: 'cpp-class-pointers.cpp',
  cppFirstLink: 'cpp-first.cpp',
  cppInheritLink: 'cpp-inheritance.cpp',
  cppPassRefLink: 'cpp-pass-by-ref.cpp',
  cppVirtualLink: 'cpp-virtual-method.cpp',
};


class OptFrontend extends AbstractBaseFrontend {
  originFrontendJsFile: string = 'opt-frontend.js';

  constructor(params) {
    super(params);
  }

  executeCode(forceStartingInstr=undefined, forceRawInputLst=undefined) {
    if (forceRawInputLst !== undefined && forceRawInputLst !== null) { // ergh
      this.rawInputLst = forceRawInputLst;
    }

    var backendOptionsObj = this.getBaseBackendOptionsObj();
    var startingInstruction = forceStartingInstr ? forceStartingInstr : 0;

    var frontendOptionsObj = this.getBaseFrontendOptionsObj();
    frontendOptionsObj.startingInstruction = startingInstruction;

    this.executeCodeAndCreateViz(this.pyInputGetValue(),
                                 $('#pythonVersionSelector').val(),
                                 backendOptionsObj,
                                 frontendOptionsObj,
                                 'pyOutputPane');
  }

  optFinishSuccessfulExecution() {
    super.optFinishSuccessfulExecution();
    /*
    if (typeof(activateSyntaxErrorSurvey) !== 'undefined' &&
        activateSyntaxErrorSurvey &&
        experimentalPopUpSyntaxErrorSurvey) {
      experimentalPopUpSyntaxErrorSurvey();
    }
    */
  }

  handleUncaughtExceptionFunc(trace) {
    super.handleUncaughtExceptionFunc(trace);

    var killerException = null;
    if (trace.length == 1) {
      killerException = trace[0]; // killer!
    } else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
      killerException = trace[trace.length - 1]; // killer!
    }

    if (killerException) {
      var excObj = {killerException: killerException, myAppState: optFrontend.getAppState()};
      prevExecutionExceptionObjLst.push(excObj);
    } else {
      prevExecutionExceptionObjLst = []; // reset!!!
    }
  }
} // END class OptFrontend


$(document).ready(function() {
  optFrontend = new OptFrontend({
                                  /*TogetherjsReadyHandler: optFrontendTogetherjsReadyHandler,
                                    TogetherjsCloseHandler: optFrontendTogetherjsCloseHandler,
                                    startSharedSession: optFrontendStartSharedSession,
                                  */
                                  appStateAugmenter: optTests.appStateAugmenter,
                                  loadTestCases: optTests.loadTestcasesIntoPane,
                                });
  optFrontend.setSurveyHTML();

  $("#hideHeaderLink").click(function() {
    $("#experimentalHeader").hide();
    var myVisualizer = optFrontend.myVisualizer;
    if (myVisualizer) {
      myVisualizer.updateOutput(); // redraw arrows to line them up again
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
      optFrontend.pyInputSetValue(dat);
      initAceAndOptions();

      // very subtle! for TogetherJS to sync #pythonVersionSelector
      // properly, we must manually send a sync request event:
      if (TogetherJS && TogetherJS.running) {
        var myVisualizer = optFrontend.myVisualizer;
        TogetherJS.send({type: "syncAppState",
                         myAppState: optFrontend.getAppState(),
                         codeInputScrollTop: optFrontend.pyInputGetScrollTop(),
                         pyCodeOutputDivScrollTop: myVisualizer ?
                                                   myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop() :
                                                   undefined});
      }
    }, 'text' /* data type - set to text or else jQuery tries to EXECUTE the JS example code, haha, eeek! */);
    return false; // prevent an HTML 'a' element click from going to a link
  });
  $('#pythonVersionSelector').change(initAceAndOptions);

  $('#genEmbedBtn').bind('click', () => {
    var mod = optFrontend.appMode;
    assert(mod == 'display' || mod == 'visualize' /* deprecated */);
    var myArgs = optFrontend.getAppState();
    delete myArgs.mode;
    myArgs.codeDivWidth = optFrontend.myVisualizer.DEFAULT_EMBEDDED_CODE_DIV_WIDTH;
    myArgs.codeDivHeight = optFrontend.myVisualizer.DEFAULT_EMBEDDED_CODE_DIV_HEIGHT;

    var domain = "http://pythontutor.com/"; // for deployment
    var embedUrlStr = $.param.fragment(domain + "iframe-embed.html", myArgs, 2 /* clobber all */);
    embedUrlStr = embedUrlStr.replace(/\)/g, '%29') // replace ) with %29 so that links embed well in Markdown
    var iframeStr = '<iframe width="800" height="500" frameborder="0" src="' + embedUrlStr + '"> </iframe>';
    $('#embedCodeOutput').val(iframeStr);
  });

  initAceAndOptions();

  if (typeof initCodeopticon !== "undefined") {
    initCodeopticon(); // defined in codeopticon-learner.js
  }

  $("#createTestsLink").click(function() {
    optTests.initTestcasesPane('#testCasesPane');
    $(this).hide();
    return false;
  });

  $("#liveModeBtn").click(function() {
    var myArgs = optFrontend.getAppState();
    var urlStr = $.param.fragment('live.html', myArgs, 2 /* clobber all */);
    window.open(urlStr); // open in new tab
  });
});
