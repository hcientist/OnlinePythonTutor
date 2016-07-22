// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

import {OptFrontend} from './opt-frontend.ts';
import {OptFrontendSharedSessions,TogetherJS} from './opt-shared-sessions.ts';
import {assert,htmlspecialchars} from './pytutor.ts';
import {OptTestcases,redSadFace,yellowHappyFace} from './opt-testcases.ts';
import {pythonExamples,javaExamples,jsExamples,tsExamples,rubyExamples,cExamples,cppExamples} from './example-links.ts';


// for TypeScript
declare var initCodeopticon: any; // FIX later when porting Codeopticon
declare var codeopticonUsername: string; // FIX later when porting Codeopticon
declare var codeopticonSession: string;  // FIX later when porting Codeopticon


var optFrontend: OptFrontend;


// augment with a "Create test cases" pane
export class OptFrontendWithTestcases extends OptFrontendSharedSessions {
  optTests: OptTestcases;

  constructor(params={}) {
    super(params);
    this.optTests = new OptTestcases(this);

    var queryStrOptions = this.getQueryStringOptions();
    if (queryStrOptions.testCasesLst) {
      this.optTests.loadTestCases(queryStrOptions.testCasesLst);
    }
    // TRICKY: call superclass's parseQueryString ONLY AFTER initializing optTests
    super.parseQueryString();
  }

  parseQueryString() {
    // TRICKY: if optTests isn't initialized yet, this means we're calling this
    // from the constructor, so do a NOP and then manually parse the query
    // string at the end of the constructor ONLY AFTER initializing optTests.
    // otherwise delegate to super.parseQueryString()
    if (this.optTests) {
      super.parseQueryString();
    }
  }

  appStateAugmenter(appState) {
    this.optTests.appStateAugmenter(appState);
  }

  runTestCase(id, codeToExec, firstTestLine) {
    // adapted from executeCode in opt-frontend.js
    var backendOptionsObj = this.getBaseBackendOptionsObj();
    var frontendOptionsObj = this.getBaseFrontendOptionsObj();

    (backendOptionsObj as any).run_test_case = true; // just so we can see this in server logs

    var runTestCaseCallback = (dat) => {
      var trace = dat.trace;

      if (trace.length == 1 && trace[0].event === 'uncaught_exception') {
        // e.g., syntax errors / compile errors
        var errorLineNo = trace[0].line;
        if (errorLineNo) {
          // highlight the faulting line in the test case pane itself
          if (errorLineNo !== undefined &&
              errorLineNo != NaN &&
              errorLineNo >= firstTestLine) {
            var adjustedErrorLineNo = errorLineNo - firstTestLine;

            var te = ace.edit('testCaseEditor_' + id);
            var s = te.getSession();

            s.setAnnotations([{row: adjustedErrorLineNo,
                               column: null, // for TS typechecking
                               type: 'error',
                               text: trace[0].exception_msg}]);
            te.gotoLine(adjustedErrorLineNo + 1); // one-indexed
          }
        }

        var msg = trace[0].exception_msg;
        var trimmedMsg = msg.split(':')[0];
        $('#outputTd_' + id).html(htmlspecialchars(trimmedMsg));
      } else {
        // scan through the trace to find any exception events. report
        // the first one if found, otherwise assume test is 'passed'
        var exceptionMsg = null;
        trace.forEach((e) => {
          if (exceptionMsg) {
            return;
          }

          if (e.event === 'exception') {
            exceptionMsg = e.exception_msg;
          }
        });

        if (exceptionMsg) {
          $('#outputTd_' + id).html('<img src="' + redSadFace + '"></img>');
        } else {
          $('#outputTd_' + id).html('<img src="' + yellowHappyFace + '"></img>');
        }
      }

      this.optTests.doneRunningTest();
    };

    this.executeCodeAndRunCallback(codeToExec,
                                   $('#pythonVersionSelector').val(),
                                   backendOptionsObj, frontendOptionsObj,
                                   runTestCaseCallback.bind(this));
  }

  // TODO: properly handle and display errors when there's a syntax
  // error ... right now it displays as a syntax error in the main pane,
  // which can be confusing
  vizTestCase(id, codeToExec, firstTestLine) {
    // adapted from executeCode in opt-frontend.js
    var backendOptionsObj = this.getBaseBackendOptionsObj();
    var frontendOptionsObj = this.getBaseFrontendOptionsObj();

    (backendOptionsObj as any).viz_test_case = true; // just so we can see this in server logs
    //activateSyntaxErrorSurvey = false; // NASTY global! disable this survey when running test cases since it gets       confusing
    (frontendOptionsObj as any).jumpToEnd = true;

    this.executeCodeAndCreateViz(codeToExec,
                                 $('#pythonVersionSelector').val(),
                                 backendOptionsObj, frontendOptionsObj,
                                 'pyOutputPane');
    this.optTests.doneRunningTest(); // this will run before the callback in executeCodeAndCreateViz, but oh wells
  }

} // END Class OptFrontendWithTestcases


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
};

var PY3_EXAMPLES = {
  tortureLink: "closures/student-torture.txt",
  nonlocalLink: "nonlocal.txt",
};

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


$(document).ready(function() {
  optFrontend = new OptFrontendWithTestcases();
  optFrontend.setSurveyHTML();

  $("#exampleSnippets")
    .append(pythonExamples)
    .append(javaExamples)
    .append(jsExamples)
    .append(tsExamples)
    .append(rubyExamples)
    .append(cExamples)
    .append(cppExamples);

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
      optFrontend.setAceMode();

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
  $('#pythonVersionSelector').change(optFrontend.setAceMode.bind(optFrontend));
  optFrontend.setAceMode();

  if (typeof initCodeopticon !== "undefined") {
    initCodeopticon(); // defined in codeopticon-learner.js
  }

  $("#liveModeBtn").click(optFrontend.openLiveModeUrl.bind(optFrontend));
});
