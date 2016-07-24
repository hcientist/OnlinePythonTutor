// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

import {OptFrontend} from './opt-frontend.ts';
import {OptFrontendSharedSessions,TogetherJS} from './opt-shared-sessions.ts';
import {assert,htmlspecialchars} from './pytutor.ts';
import {OptTestcases,redSadFace,yellowHappyFace} from './opt-testcases.ts';
import {pythonExamplesHtml,PY2_EXAMPLES,PY3_EXAMPLES,
        javaExamplesHtml,JAVA_EXAMPLES,
        jsExamplesHtml,JS_EXAMPLES,
        tsExamplesHtml,TS_EXAMPLES,
        rubyExamplesHtml,RUBY_EXAMPLES,
        cExamplesHtml,C_EXAMPLES,
        cppExamplesHtml,CPP_EXAMPLES,
        exampleHeaderHtml} from './example-links.ts';
import {footerHtml} from './footer-html.ts';

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


$(document).ready(function() {
  // initialize all HTML elements before creating optFrontend object
  $("#exampleSnippets")
    .append(exampleHeaderHtml);

  var params = {};
  var optOverride = (window as any).optOverride;
  // super hacky!
  if (optOverride) {
    (params as any).disableLocalStorageToggles = true;

    if (optOverride.frontendLang === 'java') {
      $("#exampleSnippets").append(javaExamplesHtml);
    } else if (optOverride.frontendLang === 'js') {
      $("#exampleSnippets").append(jsExamplesHtml);
    } else if (optOverride.frontendLang === 'ts') {
      $("#exampleSnippets").append(tsExamplesHtml);
    } else if (optOverride.frontendLang === 'ruby') {
      $("#exampleSnippets").append(rubyExamplesHtml);
    } else if (optOverride.frontendLang === 'c') {
      $("#exampleSnippets").append(cExamplesHtml);
    } else if (optOverride.frontendLang === 'cpp') {
      $("#exampleSnippets").append(cppExamplesHtml);
    }
  } else {
    $("#exampleSnippets")
      .append(pythonExamplesHtml)
      .append(javaExamplesHtml)
      .append(jsExamplesHtml)
      .append(tsExamplesHtml)
      .append(rubyExamplesHtml)
      .append(cExamplesHtml)
      .append(cppExamplesHtml);
  }
  $("#footer").append(footerHtml);


  optFrontend = new OptFrontendWithTestcases(params);
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
  optFrontend.setAceMode();

  if (typeof initCodeopticon !== "undefined") {
    initCodeopticon(); // defined in codeopticon-learner.js
  }

  $("#liveModeBtn").click(optFrontend.openLiveModeUrl.bind(optFrontend));
});
