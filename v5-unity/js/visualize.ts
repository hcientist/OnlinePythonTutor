// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

import {OptFrontendSharedSessions,TogetherJS} from './opt-shared-sessions';
import {assert,htmlspecialchars} from './pytutor';
import {OptTestcases,redSadFace,yellowHappyFace} from './opt-testcases';
import {pythonExamplesHtml,PY2_EXAMPLES,PY3_EXAMPLES,
        javaExamplesHtml,JAVA_EXAMPLES,
        jsExamplesHtml,JS_EXAMPLES,
        tsExamplesHtml,TS_EXAMPLES,
        rubyExamplesHtml,RUBY_EXAMPLES,
        cExamplesHtml,C_EXAMPLES,
        cppExamplesHtml,CPP_EXAMPLES,
        exampleHeaderHtml} from './example-links';
import {footerHtml} from './footer-html';
import {eureka_survey,eureka_prompt,eureka_survey_version} from './surveys';

require('./lib/jquery-3.0.0.min.js');
require('./lib/jquery.qtip.js');
require('../css/jquery.qtip.css');

// for TypeScript
declare var initCodeopticon: any; // FIX later when porting Codeopticon


// TODO: refactor into ES6 class format

// domID is the ID of the element to attach to (without the leading '#' sign)
function SyntaxErrorSurveyBubble(parentViz, domID) {
  this.parentViz = parentViz;

  this.domID = domID;
  this.hashID = '#' + domID;

  this.my = 'left top';
  this.at = 'right center';

  this.qtipHidden = false; // is there a qtip object present but hidden? (TODO: kinda confusing)
}

SyntaxErrorSurveyBubble.prototype.destroyQTip = function() {
  $(this.hashID).qtip('destroy');
}

SyntaxErrorSurveyBubble.prototype.redrawCodelineBubble = function() {
  if (this.parentViz.isOutputLineVisibleForBubbles(this.domID)) {
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
  return '#qtip-' + this.domID + '-content';
}

SyntaxErrorSurveyBubble.prototype.qTipID = function() {
  return '#qtip-' + this.domID;
}


// augment with a "Create test cases" pane
export class OptFrontendWithTestcases extends OptFrontendSharedSessions {
  optTests: OptTestcases;

  prevExecutionExceptionObjLst = []; // previous consecutive executions with "compile"-time exceptions

  prevExecutionRuntimeErrorMsg: string = null; // did the previous execution have a run-time error? if so, what was the error message?
  prevExecutionRuntimeErrorLine: number = null; // line number of previous run-time error (if any)
  prevExecutionRuntimeErrorCode: string = null; // full code involved in previous run-time error (if any)

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
    if (this.optTests) {
      this.optTests.appStateAugmenter(appState);
    }
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
    this.activateSyntaxErrorSurvey = false; // to avoid confusion with failed tests
    this.activateRuntimeErrorSurvey = false; // to avoid confusion with failed tests
    (frontendOptionsObj as any).jumpToEnd = true;

    this.executeCodeAndCreateViz(codeToExec,
                                 $('#pythonVersionSelector').val(),
                                 backendOptionsObj, frontendOptionsObj,
                                 'pyOutputPane');
    this.optTests.doneRunningTest(); // this will run before the callback in executeCodeAndCreateViz, but oh wells
  }

  handleUncaughtException(trace) {
    super.handleUncaughtException(trace); // do this first

    var killerException = null;
    if (trace.length == 1) {
      killerException = trace[0];
    } else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
      killerException = trace[trace.length - 1];
    }

    // "compile"-time error
    if (killerException) {
      var excObj = {killerException: killerException, myAppState: this.getAppState()};
      this.prevExecutionExceptionObjLst.push(excObj);
      this.prevExecutionRuntimeErrorMsg = null; // no run-time error since we had a compile-time error
      this.prevExecutionRuntimeErrorLine = null;
      this.prevExecutionRuntimeErrorCode = null;
    }
  }

  finishSuccessfulExecution() {
    super.finishSuccessfulExecution(); // do this first
    if (this.activateSyntaxErrorSurvey) {
      this.experimentalPopUpSyntaxErrorSurvey();
    }
    this.prevExecutionExceptionObjLst = []; // reset this since there was no compile-time error

    if (this.activateRuntimeErrorSurvey) {
      this.popupRuntimeErrorSurvey();
    }
    this.prevExecutionRuntimeErrorMsg = null; // clear this now and populate it in updateOutputCallbackFunc
    this.prevExecutionRuntimeErrorLine = null;
    this.prevExecutionRuntimeErrorCode = null;

    // put eureka_survey below #codAndNav so that it's highly visible:
    if (this.activateEurekaSurvey) {
      this.myVisualizer.domRoot.find('#codAndNav').append(eureka_survey);
      this.myVisualizer.domRoot.find('#codAndNav #eureka_survey').css('margin-top', '30px'); // leave some extra space
      var that = this;
      $('.surveyBtnBig').click(function(e) {
        var myArgs = that.getAppState();
        var buttonPrompt = $(this).html();
        var res = prompt(eureka_prompt);
        // don't do ajax call when Cancel button is pressed
        // (note that if OK button is pressed with no response, then an
        // empty string will still be sent to the server)
        if (res !== null) {
          (myArgs as any).surveyVersion = eureka_survey_version;
          (myArgs as any).surveyQuestion = buttonPrompt;
          (myArgs as any).surveyResponse = res;
          (myArgs as any).opt_uuid = that.userUUID;
          (myArgs as any).session_uuid = that.sessionUUID;
          $.get('eureka_survey.py', myArgs, function(dat) {});
        }
      });
    }
  }

  // called whenever myVisualizer.updateOutput() is called to update the visualization;
  // set prevExecutionRuntimeErrorMsg / line / code if the user has stepped to a trace
  // entry that contains an error message. the rationale for doing this
  // is that we want to display only errors that the user has stepped to
  // and seen with their own eyes so that they can hopefully know what the
  // error message is referring to ...
  updateOutputCallbackFunc() {
    super.updateOutputCallbackFunc();
    if (this.myVisualizer) {
      var curEntry = this.myVisualizer.curTrace[this.myVisualizer.curInstr];
      if (curEntry.event === "exception") {
        this.prevExecutionRuntimeErrorMsg = curEntry.exception_msg;
        this.prevExecutionRuntimeErrorLine = curEntry.line;
        this.prevExecutionRuntimeErrorCode = this.myVisualizer.curInputCode;
      }
    }
  }

  // created on 2015-04-18
  experimentalPopUpSyntaxErrorSurvey() {
    if (this.prevExecutionExceptionObjLst.length > 0) {
      // work with the most recent entry
      var prevExecutionExceptionObj = this.prevExecutionExceptionObjLst[this.prevExecutionExceptionObjLst.length - 1];
      var offendingLine = prevExecutionExceptionObj.killerException.line;

      if (offendingLine === undefined) {
        return; // get out early!
      }

      // if we've switched languages between the previous error and this
      // run, then DON'T pop up a survey since the point is moot anyhow;
      // there's no point in asking the question when the language has changed
      var curState = this.getAppState();
      if (prevExecutionExceptionObj.myAppState.py != curState.py) {
        return;
      }

      var bub = new SyntaxErrorSurveyBubble(this.myVisualizer, 'pyCodeOutputDiv');

      // destroy then create a new tip:
      bub.destroyQTip();
      $(bub.hashID).qtip({
        show: {
          ready: true, // show on document.ready instead of on mouseenter
          delay: 0,
          event: null,
          effect: function() {$(this).show();}, // don't do any fancy fading because it screws up with scrolling
        },
        hide: {
          fixed: true,
          event: null,
          effect: function() {$(this).hide();}, // don't do any fancy fading because it screws up with scrolling
        },

        content: ' ', // can't be empty!
        id: bub.domID,
        position: {
          my: bub.my,
          at: bub.at,
          adjust: {
            x: 10,
          },
        },
        style: {
          classes: 'qtip-light',
        }
      });

      /*
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
      */

      /*
      var version = 'v4'; // deployed on 2017-05-15
      var surveyBubbleHTML = '<div id="syntaxErrBubbleContents">\
                                <div id="syntaxErrHeader">You just fixed the following error:</div>\
                                <div id="syntaxErrCodeDisplay"></div>\
                                <div id="syntaxErrMsg"></div>\
                                <div id="syntaxErrQuestion">\
                                  Please help us improve this tool.\
                                  What would have been the most helpful error message for you to see here?<br/>\
                                   <input type="text" id="syntaxErrTxtInput" size=62 maxlength=150/><br/>\
                                   <button id="syntaxErrSubmitBtn" type="button">Submit</button>\
                                   <button id="syntaxErrCloseBtn" type="button">Close</button>\
                                   <a href="#" id="syntaxErrHideAllLink">Hide all of these pop-ups</a>\
                                </div>\
                              </div>'
      */

      var version = 'v5'; // deployed on 2017-05-20
      // directly ask about what they thought caused the error instead of having them (indirectly)
      // suggest a better error message. this now matches the wording of runtime_err_survey v2.
      var surveyBubbleHTML = '<div id="syntaxErrBubbleContents">\
                                <div id="syntaxErrHeader">You just fixed the following error:</div>\
                                <div id="syntaxErrCodeDisplay"></div>\
                                <div id="syntaxErrMsg"></div>\
                                <div id="syntaxErrQuestion">\
                                  Please help us improve this tool with your feedback.<br/>\
                                  What misunderstanding do you think caused this error?<br/>\
                                   <input type="text" id="syntaxErrTxtInput" size=58 maxlength=150/><br/>\
                                   <button id="syntaxErrSubmitBtn" type="button">Submit</button>\
                                   <button id="syntaxErrCloseBtn" type="button">Close</button>\
                                   <a href="#" id="syntaxErrHideAllLink">Hide all of these pop-ups</a>\
                                </div>\
                              </div>'

      $(bub.qTipContentID()).html(surveyBubbleHTML);

      $(bub.qTipContentID() + ' #syntaxErrSubmitBtn').click(() => {
        var res = $(bub.qTipContentID() + ' #syntaxErrTxtInput').val();
        var resObj = {appState: this.getAppState(),
                      exc: prevExecutionExceptionObj,
                      opt_uuid: this.userUUID,
                      session_uuid: this.sessionUUID,
                      reply: res,
                      type: 'submit',
                      v: version};
        $.get('syntax_err_survey.py', {arg: JSON.stringify(resObj)}, function(dat) {});

        bub.destroyQTip();
      });

      $(bub.qTipContentID() + ' #syntaxErrCloseBtn').click(() => {
        // grab the value anyways in case the learner wrote something decent ...
        var res = $(bub.qTipContentID() + ' #syntaxErrTxtInput').val();
        var resObj = {appState: this.getAppState(),
                      exc: prevExecutionExceptionObj,
                      opt_uuid: this.userUUID,
                      session_uuid: this.sessionUUID,
                      reply: res,
                      type: 'close',
                      v: version};
        $.get('syntax_err_survey.py', {arg: JSON.stringify(resObj)}, function(dat) {});

        bub.destroyQTip();
      });

      $(bub.qTipContentID() + ' #syntaxErrHideAllLink').click(() => {
        // grab the value anyways in case the learner wrote something decent ...
        var res = $(bub.qTipContentID() + ' #syntaxErrTxtInput').val();
        var resObj = {appState: this.getAppState(),
                      exc: prevExecutionExceptionObj,
                      opt_uuid: this.userUUID,
                      session_uuid: this.sessionUUID,
                      reply: res,
                      type: 'killall',
                      v: version};
        $.get('syntax_err_survey.py', {arg: JSON.stringify(resObj)}, function(dat) {});

        this.activateSyntaxErrorSurvey = false;
        bub.destroyQTip();

        return false; // otherwise the 'a href' will trigger a page reload, ergh!
      });


      var bubbleAceEditor = ace.edit('syntaxErrCodeDisplay');
      bubbleAceEditor.$blockScrolling = Infinity; // kludgy to shut up weird warnings
      bubbleAceEditor.setOptions({minLines: 1, maxLines: 5}); // keep this SMALL
      bubbleAceEditor.setValue(prevExecutionExceptionObj.myAppState.code.rtrim(), -1);

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
      bubbleAceEditor.setFontSize('10px');

      $('#syntaxErrCodeDisplay').css('width', '350px');
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

      s.setAnnotations([{row: offendingLine - 1,
                         column: null,
                         type: 'error',
                         text: prevExecutionExceptionObj.killerException.exception_msg}]);

      bub.redrawCodelineBubble(); // do an initial redraw to align everything
      (bubbleAceEditor as any).scrollToLine(offendingLine - 1, true);

      // don't forget htmlspecialchars
      $("#syntaxErrMsg").html(htmlspecialchars(prevExecutionExceptionObj.killerException.exception_msg));

      // unbind scroll handler first, then bind new one
      this.myVisualizer.domRoot.find('#pyCodeOutputDiv')
        .unbind('scroll')
        .scroll(function() {
          bub.redrawCodelineBubble();
        });

      // log an event whenever this bubble is show (i.e., an 'impression')
      // NB: it might actually be hidden if it appears on a line that
      // isn't initially visible to the user, but whatevers ...
      var impressionObj = {appState: this.getAppState(),
                           exceptionLst: this.prevExecutionExceptionObjLst,
                           opt_uuid: this.userUUID,
                           session_uuid: this.sessionUUID,
                           type: 'show',
                           v: version};
      $.get('syntax_err_survey.py', {arg: JSON.stringify(impressionObj)}, function(dat) {});
    }
  }

  // created on 2017-05-15 to mimic experimentalPopUpSyntaxErrorSurvey
  // (lots of copy-pasta!!!), except this is for run-time errors instead of
  // compile-time (i.e., syntax) errors
  popupRuntimeErrorSurvey() {
    var noErrorsInCurTrace = true;
    // scan through the entire trace to make sure there are no errors;
    // if there are any errors, then we haven't really definitively "fixed"
    // all of the run-time errors yet, so don't display a pop-up message
    for (var i = 0; i < this.myVisualizer.curTrace.length; i++) {
      if (this.myVisualizer.curTrace[i].event === "exception") {
        noErrorsInCurTrace = false;
        break;
      }
    }

    if (this.prevExecutionRuntimeErrorMsg && noErrorsInCurTrace) {
      var savedPrevExecutionRuntimeErrorMsg = this.prevExecutionRuntimeErrorMsg; // save it now!
      var savedPrevExecutionRuntimeErrorLine = this.prevExecutionRuntimeErrorLine;
      var savedPrevExecutionRuntimeErrorCode = this.prevExecutionRuntimeErrorCode;

      var bub = new SyntaxErrorSurveyBubble(this.myVisualizer, 'pyCodeOutputDiv');

      // destroy then create a new tip:
      bub.destroyQTip();
      $(bub.hashID).qtip({
        show: {
          ready: true, // show on document.ready instead of on mouseenter
          delay: 0,
          event: null,
          effect: function() {$(this).show();}, // don't do any fancy fading because it screws up with scrolling
        },
        hide: {
          fixed: true,
          event: null,
          effect: function() {$(this).hide();}, // don't do any fancy fading because it screws up with scrolling
        },

        content: ' ', // can't be empty!
        id: bub.domID,
        position: {
          my: bub.my,
          at: bub.at,
          adjust: {
            x: 10,
          },
        },
        style: {
          classes: 'qtip-light',
        }
      });


      //var version = 'v1'; // deployed on 2017-05-15
      // v1 wording: "What misunderstanding originally caused this error?"

      var version = 'v2'; // deployed on 2017-05-20
      // v2 wording: "Please help us improve this tool with your feedback.\nWhat misunderstanding do you think caused this error?"

      var surveyBubbleHTML = '<div id="syntaxErrBubbleContents">\
                                <div id="syntaxErrHeader">You just fixed this error from the last time your code ran:</div>\
                                <div id="syntaxErrCodeDisplay"></div>\
                                <div id="syntaxErrMsg"></div>\
                                <div id="syntaxErrQuestion">\
                                  Please help us improve this tool with your feedback.<br/>\
                                  What misunderstanding do you think caused this error?<br/>\
                                   <input type="text" id="syntaxErrTxtInput" size=58 maxlength=150/><br/>\
                                   <button id="syntaxErrSubmitBtn" type="button">Submit</button>\
                                   <button id="syntaxErrCloseBtn" type="button">Close</button>\
                                   <a href="#" id="syntaxErrHideAllLink">Hide all of these pop-ups</a>\
                                </div>\
                              </div>'

      $(bub.qTipContentID()).html(surveyBubbleHTML);

      $(bub.qTipContentID() + ' #syntaxErrSubmitBtn').click(() => {
        var res = $(bub.qTipContentID() + ' #syntaxErrTxtInput').val();
        var resObj = {appState: this.getAppState(),
                      err_msg: savedPrevExecutionRuntimeErrorMsg,
                      err_line: savedPrevExecutionRuntimeErrorLine,
                      err_code: savedPrevExecutionRuntimeErrorCode,
                      opt_uuid: this.userUUID,
                      session_uuid: this.sessionUUID,
                      reply: res,
                      type: 'submit',
                      v: version};
        $.get('runtime_err_survey.py', {arg: JSON.stringify(resObj)}, function(dat) {});

        bub.destroyQTip();
      });

      $(bub.qTipContentID() + ' #syntaxErrCloseBtn').click(() => {
        // grab the value anyways in case the learner wrote something decent ...
        var res = $(bub.qTipContentID() + ' #syntaxErrTxtInput').val();
        var resObj = {appState: this.getAppState(),
                      err_msg: savedPrevExecutionRuntimeErrorMsg,
                      err_line: savedPrevExecutionRuntimeErrorLine,
                      err_code: savedPrevExecutionRuntimeErrorCode,
                      opt_uuid: this.userUUID,
                      session_uuid: this.sessionUUID,
                      reply: res,
                      type: 'close',
                      v: version};
        $.get('runtime_err_survey.py', {arg: JSON.stringify(resObj)}, function(dat) {});

        bub.destroyQTip();
      });

      $(bub.qTipContentID() + ' #syntaxErrHideAllLink').click(() => {
        // grab the value anyways in case the learner wrote something decent ...
        var res = $(bub.qTipContentID() + ' #syntaxErrTxtInput').val();
        var resObj = {appState: this.getAppState(),
                      err_msg: savedPrevExecutionRuntimeErrorMsg,
                      err_line: savedPrevExecutionRuntimeErrorLine,
                      err_code: savedPrevExecutionRuntimeErrorCode,
                      opt_uuid: this.userUUID,
                      session_uuid: this.sessionUUID,
                      reply: res,
                      type: 'killall',
                      v: version};
        $.get('runtime_err_survey.py', {arg: JSON.stringify(resObj)}, function(dat) {});

        this.activateRuntimeErrorSurvey = false;
        bub.destroyQTip();

        return false; // otherwise the 'a href' will trigger a page reload, ergh!
      });

      var bubbleAceEditor = ace.edit('syntaxErrCodeDisplay');
      bubbleAceEditor.$blockScrolling = Infinity; // kludgy to shut up weird warnings
      bubbleAceEditor.setOptions({minLines: 1, maxLines: 5}); // keep this SMALL
      bubbleAceEditor.setValue(savedPrevExecutionRuntimeErrorCode, -1);

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
      bubbleAceEditor.setFontSize('10px');

      $('#syntaxErrCodeDisplay').css('width', '350px');
      $('#syntaxErrCodeDisplay').css('height', '90px'); // VERY IMPORTANT so that it works on I.E., ugh!

      // don't do real-time syntax checks:
      // https://github.com/ajaxorg/ace/wiki/Syntax-validation
      s.setOption("useWorker", false);
      bubbleAceEditor.setReadOnly(true);

      s.setAnnotations([{row: savedPrevExecutionRuntimeErrorLine - 1,
                         column: null,
                         type: 'error',
                         text: savedPrevExecutionRuntimeErrorMsg}]);

      bub.redrawCodelineBubble(); // do an initial redraw to align everything
      (bubbleAceEditor as any).scrollToLine(savedPrevExecutionRuntimeErrorLine - 1, true);

      // don't forget htmlspecialchars
      $("#syntaxErrMsg").html(htmlspecialchars(savedPrevExecutionRuntimeErrorMsg));

      // unbind scroll handler first, then bind new one
      this.myVisualizer.domRoot.find('#pyCodeOutputDiv')
        .unbind('scroll')
        .scroll(function() {
          bub.redrawCodelineBubble();
        });

      // log an event whenever this bubble is show (i.e., an 'impression')
      // NB: it might actually be hidden if it appears on a line that
      // isn't initially visible to the user, but whatevers ...
      var impressionObj = {appState: this.getAppState(),
                           err_msg: savedPrevExecutionRuntimeErrorMsg,
                           err_line: savedPrevExecutionRuntimeErrorLine,
                           err_code: savedPrevExecutionRuntimeErrorCode,
                           opt_uuid: this.userUUID,
                           session_uuid: this.sessionUUID,
                           type: 'show',
                           v: version};
      $.get('runtime_err_survey.py', {arg: JSON.stringify(impressionObj)}, function(dat) {});
    }
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

  // insert a toggle for examples after #exampleSnippets, then hide it
  $("#exampleSnippets").after('<a href="#" id="showExampleLink" style="font-size: 11pt;">Show example code and courses</a>');
  $("#showExampleLink").click(() => {
    $("#exampleSnippets").show();
    $("#showExampleLink").hide();
    return false; // don't follow the href link
  });
  $("#exampleSnippets").hide();

  var optFrontend = new OptFrontendWithTestcases(params);
  optFrontend.setSurveyHTML();

  (window as any).optFrontend = optFrontend; // purposely leak to globals to ease debugging!!!

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

    if (lang === '2' || lang === '3' || lang === 'py3anaconda') {
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
