// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

import {OptFrontend,OptFrontendWithTestcases} from './opt-frontend.ts';
import {ExecutionVisualizer, assert, htmlspecialchars} from './pytutor.ts';

// for TypeScript
declare var initCodeopticon: any; // FIX later when porting Codeopticon
declare var codeopticonUsername: string; // FIX later when porting Codeopticon
declare var codeopticonSession: string;  // FIX later when porting Codeopticon

// TODO: reinstate shared session stuff later
var TogetherJS; // temporary stent -- this WON'T WORK right now, ergh

var optFrontend: OptFrontend;

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


$(document).ready(function() {
  optFrontend = new OptFrontendWithTestcases({
                                  /*TogetherjsReadyHandler: optFrontendTogetherjsReadyHandler,
                                    TogetherjsCloseHandler: optFrontendTogetherjsCloseHandler,
                                    startSharedSession: optFrontendStartSharedSession,
                                  */
                                });
  optFrontend.setSurveyHTML();

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

  // TODO: maybe move into the OptFrontend class?
  $('#genEmbedBtn').bind('click', () => {
    var mod = optFrontend.appMode;
    assert(mod == 'display' || mod == 'visualize' /* deprecated */);
    var myArgs = optFrontend.getAppState();
    delete myArgs.mode;
    (myArgs as any).codeDivWidth = ExecutionVisualizer.DEFAULT_EMBEDDED_CODE_DIV_WIDTH;
    (myArgs as any).codeDivHeight = ExecutionVisualizer.DEFAULT_EMBEDDED_CODE_DIV_HEIGHT;

    var domain = "http://pythontutor.com/"; // for deployment
    var embedUrlStr = $.param.fragment(domain + "iframe-embed.html", myArgs, 2 /* clobber all */);
    embedUrlStr = embedUrlStr.replace(/\)/g, '%29') // replace ) with %29 so that links embed well in Markdown
    var iframeStr = '<iframe width="800" height="500" frameborder="0" src="' + embedUrlStr + '"> </iframe>';
    $('#embedCodeOutput').val(iframeStr);
  });

  optFrontend.setAceMode();

  if (typeof initCodeopticon !== "undefined") {
    initCodeopticon(); // defined in codeopticon-learner.js
  }

  $("#liveModeBtn").click(optFrontend.openLiveModeUrl.bind(optFrontend));
});
