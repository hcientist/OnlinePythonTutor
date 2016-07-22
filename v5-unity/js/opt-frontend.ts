// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

/* TODO:

- parse Java viz_options in users' java code:
  https://github.com/daveagp/java_visualize/blob/1489078712310eda44391f09405e0f71b2b190c9/jv-frontend.js#L101

  - implement other missing Java functionality while i'm at it :0
    - also implement these options and stdin support too:
      var optionNames = ['showStringsAsObjects', 'showAllFields', 'disableNesting'];

- we're referring to top-level CSS selectors on the page; maybe use a
  this.domRoot pattern like in pytutor.ts?

- qtip doesn't work with Webpack, so experimentalPopUpSyntaxErrorSurvey
  DOESN'T WORK deactivate it for now
  - reinstate SyntaxErrorSurveyBubble later from cruft/syntax-error-bubble.js

    require('./lib/jquery.qtip.min.js');
    require('../css/jquery.qtip.css');

*/


// for TypeScript
declare var initCodeopticon: any; // FIX later when porting Codeopticon
declare var codeopticonUsername: string; // FIX later when porting Codeopticon
declare var codeopticonSession: string;  // FIX later when porting Codeopticon

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

// VERY IMPORTANT to grab the value of  togetherjsInUrl before loading
// togetherjs-min.js, since loading that file deletes #togetherjs from URL
// NB: kinda gross global
var togetherjsInUrl = !!(window.location.hash.match(/^#togetherjs/)); // turn into bool
if (togetherjsInUrl) {
  console.log("togetherjsInUrl!");
}

require('script!./lib/togetherjs/togetherjs-min.js');

export var TogetherJS = (window as any).TogetherJS;

// need to directly import the class for type checking to work
import {AbstractBaseFrontend, generateUUID, supports_html5_storage} from './opt-frontend-common.ts';
import {OptTestcases, redSadFace, yellowHappyFace} from './opt-testcases.ts';
import {ExecutionVisualizer, assert, htmlspecialchars} from './pytutor.ts';

require('../css/opt-frontend.css');
require('../css/opt-testcases.css');


const JAVA_BLANK_TEMPLATE = 'public class YourClassNameHere {\n\
    public static void main(String[] args) {\n\
\n\
    }\n\
}'

const CPP_BLANK_TEMPLATE = 'int main() {\n\
\n\
  return 0;\n\
}'

const CODE_SNAPSHOT_DEBOUNCE_MS = 1000;
const SUBMIT_UPDATE_HISTORY_INTERVAL_MS = 1000 * 60;


export class OptFrontend extends AbstractBaseFrontend {
  originFrontendJsFile: string = 'opt-frontend.js';
  pyInputAceEditor = undefined; // Ace editor object that contains the user's code

  prevExecutionExceptionObjLst = []; // previous consecutive executions with "compile"-time exceptions

  constructor(params={}) {
    super(params);

    $('#genEmbedBtn').bind('click', () => {
      var mod = this.appMode;
      assert(mod == 'display' || mod == 'visualize' /* deprecated */);
      var myArgs = this.getAppState();
      delete myArgs.mode;
      (myArgs as any).codeDivWidth = ExecutionVisualizer.DEFAULT_EMBEDDED_CODE_DIV_WIDTH;
      (myArgs as any).codeDivHeight = ExecutionVisualizer.DEFAULT_EMBEDDED_CODE_DIV_HEIGHT;

      var domain = "http://pythontutor.com/"; // for deployment
      var embedUrlStr = $.param.fragment(domain + "iframe-embed.html", myArgs, 2 /* clobber all */);
      embedUrlStr = embedUrlStr.replace(/\)/g, '%29') // replace ) with %29 so that links embed well in Markdown
      var iframeStr = '<iframe width="800" height="500" frameborder="0" src="' + embedUrlStr + '"> </iframe>';
      $('#embedCodeOutput').val(iframeStr);
    });

    this.initAceEditor(420);

    // for some weird reason, jQuery doesn't work here:
    //   $(window).bind("hashchange"
    window.addEventListener("hashchange", (e) => {
      // if you've got some preseeded code, then parse the entire query
      // string from scratch just like a page reload
      if ($.bbq.getState('code')) {
        this.parseQueryString();
      } else {
        // otherwise just do an incremental update
        var newMode = $.bbq.getState('mode');
        this.updateAppDisplay(newMode);
      }
    });

    // also fires when you resize the jQuery UI slider, interesting!
    $(window).resize(this.redrawConnectors.bind(this));

    $('#genUrlBtn').bind('click', () => {
      var myArgs = this.getAppState();
      var urlStr = $.param.fragment(window.location.href, myArgs, 2); // 2 means 'override'
      urlStr = urlStr.replace(/\)/g, '%29') // replace ) with %29 so that links embed well in Markdown
      $('#urlOutput').val(urlStr);
    });

    // OMG nasty wtf?!?
    // From: http://stackoverflow.com/questions/21159301/quotaexceedederror-dom-exception-22-an-attempt-was-made-to-add-something-to-st
    // Safari, in Private Browsing Mode, looks like it supports localStorage but all calls to setItem
    // throw QuotaExceededError. We're going to detect this and just silently drop any calls to setItem
    // to avoid the entire page breaking, without having to do a check at each usage of Storage.
    if (typeof localStorage === 'object') {
      try {
        localStorage.setItem('localStorage', '1');
        localStorage.removeItem('localStorage');
      } catch (e) {
        (Storage as any).prototype._setItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function() {}; // make it a NOP
        alert('Your web browser does not support storing settings locally. In Safari, the most common cause of this is using "Private Browsing Mode". Some features may not work properly for you.');
      }
    }

    // first initialize options from HTML LocalStorage. very important
    // that this code runs FIRST so that options get overridden by query
    // string options and anything else the user wants to override with.
    if (supports_html5_storage()) {
      var lsKeys = ['cumulative',
                    'heapPrimitives',
                    'py',
                    'textReferences'];
      // restore toggleState if available
      var lsOptions = {};
      $.each(lsKeys, function(i, k) {
        var v = localStorage.getItem(k);
        if (v) {
          lsOptions[k] = v;
        }
      });
      this.setToggleOptions(lsOptions);

      // store in localStorage whenever user explicitly changes any toggle option:
      $('#cumulativeModeSelector,#heapPrimitivesSelector,#textualMemoryLabelsSelector,#pythonVersionSelector').change(() => {
        var ts = this.getToggleState();
        $.each(ts, function(k, v) {
          localStorage.setItem(k, v);
        });
      });
    }

    // when you leave or reload the page, submit an updateHistoryJSON if you
    // have one. beforeunload seems to work better than unload(), but it's
    // still a bit flaky ... TODO: investigate :(
    $(window).on('beforeunload', () => {
      this.submitUpdateHistory('beforeunload');
      // don't return anything, or a modal dialog box might pop up
    });

    // just do this as well, even though it might be hella redundant
    $(window).on('unload', () => {
      this.submitUpdateHistory('unload');
      // don't return anything, or a modal dialog box might pop up
    });

    // periodically do submitUpdateHistory() to handle the case when
    // someone is simply idle on the page without reloading it or
    // re-editing code; that way, we can still get some signals rather
    // than nothing.
    var lastSubmittedUpdateHistoryLength = 0;
    setInterval(() => {
      if (this.myVisualizer) {
        var uh = this.myVisualizer.updateHistory;
        // don't submit identical entries repeatedly since that's redundant
        if (uh && (uh.length != lastSubmittedUpdateHistoryLength)) {
          lastSubmittedUpdateHistoryLength = uh.length;
          this.submitUpdateHistory('periodic');
        }
      }
    }, SUBMIT_UPDATE_HISTORY_INTERVAL_MS);

    this.parseQueryString(); // do this at the end after Ace editor initialized
  }

  // Compress updateHistory before encoding and sending to
  // the server so that it takes up less room in the URL. Have each
  // entry except for the first be a delta from the FIRST entry.
  compressUpdateHistoryList() {
    assert(this.myVisualizer);
    var uh = this.myVisualizer.updateHistory;
    var encodedUh = [];
    if (uh) {
      encodedUh.push(uh[0]);

      var firstTs = uh[0][1];
      for (var i = 1; i < uh.length; i++) {
        var e = uh[i];
        encodedUh.push([e[0], e[1] - firstTs]);
      }

      // finally push a final entry with the current timestamp delta
      var curTs = new Date().getTime();
      encodedUh.push([this.myVisualizer.curInstr, curTs - firstTs]);
    }
    return encodedUh;
  }

  // this feature was deployed on 2015-09-17, so check logs for
  // viz_interaction.py
  submitUpdateHistory(why) {
    if (this.myVisualizer) {
      var encodedUh = this.compressUpdateHistoryList();
      var encodedUhJSON = JSON.stringify(encodedUh);

      var myArgs: any = {session_uuid: this.sessionUUID,
                         updateHistoryJSON: encodedUhJSON};
      if (why) {
        myArgs.why = why;
      }
      $.get('viz_interaction.py', myArgs, (dat) => {});
    }
  }

  initAceEditor(height: number) {
    assert(!this.pyInputAceEditor);
    this.pyInputAceEditor = ace.edit('codeInputPane');
    var s = this.pyInputAceEditor.getSession();
    // tab -> 4 spaces
    s.setTabSize(4);
    s.setUseSoftTabs(true);
    // disable extraneous indicators:
    s.setFoldStyle('manual'); // no code folding indicators
    s.getDocument().setNewLineMode('unix'); // canonicalize all newlines to unix format
    this.pyInputAceEditor.setHighlightActiveLine(false);
    this.pyInputAceEditor.setShowPrintMargin(false);
    this.pyInputAceEditor.setBehavioursEnabled(false);
    this.pyInputAceEditor.$blockScrolling = Infinity; // kludgy to shut up weird warnings

    // auto-grow height as fit
    this.pyInputAceEditor.setOptions({minLines: 18, maxLines: 1000});

    $('#codeInputPane').css('width', '700px');
    $('#codeInputPane').css('height', height + 'px'); // VERY IMPORTANT so that it works on I.E., ugh!

    this.initDeltaObj();
    this.pyInputAceEditor.on('change', (e) => {
      $.doTimeout('pyInputAceEditorChange', CODE_SNAPSHOT_DEBOUNCE_MS, this.snapshotCodeDiff.bind(this)); // debounce
      this.clearFrontendError();
      s.clearAnnotations();
    });

    // don't do real-time syntax checks:
    // https://github.com/ajaxorg/ace/wiki/Syntax-validation
    s.setOption("useWorker", false);

    this.setAceMode();
    this.pyInputAceEditor.focus();
  }

  setAceMode() {
    var selectorVal = $('#pythonVersionSelector').val();
    var mod;
    var tabSize = 2;
    var editorVal = $.trim(this.pyInputGetValue());

    if (editorVal === JAVA_BLANK_TEMPLATE || editorVal === CPP_BLANK_TEMPLATE) {
      editorVal = '';
      this.pyInputSetValue(editorVal);
    }

    if (selectorVal === 'java') {
      mod = 'java';
      if (editorVal === '') {
        this.pyInputSetValue(JAVA_BLANK_TEMPLATE);
      }
    } else if (selectorVal === 'js') {
      mod = 'javascript';
    } else if (selectorVal === 'ts') {
      mod = 'typescript';
    } else if (selectorVal === 'ruby') {
      mod = 'ruby';
    } else if (selectorVal === 'c' || selectorVal == 'cpp') {
      mod = 'c_cpp';
      if (editorVal === '') {
        this.pyInputSetValue(CPP_BLANK_TEMPLATE);
      }
    } else {
      assert(selectorVal === '2' || selectorVal == '3')
      mod = 'python';
      tabSize = 4; // PEP8 style standards
    }
    assert(mod);

    var s = this.pyInputAceEditor.getSession();
    s.setMode("ace/mode/" + mod);
    s.setTabSize(tabSize);
    s.setUseSoftTabs(true);

    // clear all error displays when switching modes
    var s = this.pyInputAceEditor.getSession();
    s.clearAnnotations();

    if (selectorVal === 'java') {
      $("#javaOptionsPane").show();
    } else {
      $("#javaOptionsPane").hide();
    }

    if (selectorVal === 'js' || selectorVal === '2' || selectorVal === '3') {
      $("#liveModeBtn").show();
    } else {
      $("#liveModeBtn").hide();
    }

    this.clearFrontendError();
  }

  pyInputGetValue() {
    return this.pyInputAceEditor.getValue();
  }

  pyInputSetValue(dat) {
    this.pyInputAceEditor.setValue(dat.rtrim() /* kill trailing spaces */,
                                   -1 /* do NOT select after setting text */);
    $('#urlOutput,#embedCodeOutput').val('');
    this.clearFrontendError();
    // also scroll to top to make the UI more usable on smaller monitors
    // TODO: this has a global impact on the document, so breaks modularity?
    $(document).scrollTop(0);
  }

  pyInputGetScrollTop() {
    return this.pyInputAceEditor.getSession().getScrollTop();
  }

  pyInputSetScrollTop(st) {
    this.pyInputAceEditor.getSession().setScrollTop(st);
  }

  executeCodeFromScratch() {
    // don't execute empty string:
    if (this.pyInputAceEditor && $.trim(this.pyInputGetValue()) == '') {
      this.setFronendError(["Type in some code to visualize."]);
      return;
    }
    super.executeCodeFromScratch();
  }

  executeCode(forceStartingInstr=0, forceRawInputLst=undefined) {
    // if you're in display mode, kick back into edit mode before executing
    // or else the display might not refresh properly ... ugh krufty
    if (this.appMode != 'edit') {
      this.enterEditMode();
    }

    if (forceRawInputLst !== undefined && forceRawInputLst !== null) {
      this.rawInputLst = forceRawInputLst;
    }

    var backendOptionsObj = this.getBaseBackendOptionsObj();
    var frontendOptionsObj = this.getBaseFrontendOptionsObj();
    frontendOptionsObj.startingInstruction = forceStartingInstr;

    this.snapshotCodeDiff(); // do ONE MORE snapshot before we execute, or else
                             // we'll miss a diff if the user hits Visualize Execution
                             // very shortly after finishing coding
    if (this.deltaObj) {
      this.deltaObj.executeTime = new Date().getTime();
    }

    this.executeCodeAndCreateViz(this.pyInputGetValue(),
                                 $('#pythonVersionSelector').val(),
                                 backendOptionsObj,
                                 frontendOptionsObj,
                                 'pyOutputPane');

    this.initDeltaObj(); // clear deltaObj to start counting over again
  }

  finishSuccessfulExecution() {
    this.enterDisplayMode(); // do this first!

    if (this.myVisualizer) {
      this.myVisualizer.add_pytutor_hook("end_updateOutput", (args) => {
        // TODO: implement for codeopticon
        // debounce to compress a bit ... 250ms feels "right"
        $.doTimeout('updateOutputLogEvent', 250, () => {
          var obj: any = {type: 'updateOutput', step: args.myViz.curInstr,
                     curline: args.myViz.curLineNumber,
                     prevline: args.myViz.prevLineNumber};
          // optional fields
          if (args.myViz.curLineExceptionMsg) {
            obj.exception = args.myViz.curLineExceptionMsg;
          }
          if (args.myViz.curLineIsReturn) {
            obj.curLineIsReturn = true;
          }
          if (args.myViz.prevLineIsReturn) {
            obj.prevLineIsReturn = true;
          }
          this.logEventCodeopticon(obj);
        });

        // 2014-05-25: implemented more detailed tracing for surveys
        if (args.myViz.creationTime) {
          var curTs = new Date().getTime();

          var uh = args.myViz.updateHistory;
          assert(uh.length > 0); // should already be seeded with an initial value
          if (uh.length > 1) { // don't try to "compress" the very first entry
            var lastTs = uh[uh.length - 1][1];
            // (debounce entries that are less than 1 second apart to
            // compress the logs a bit when there's rapid scrubbing or scrolling)
            if ((curTs - lastTs) < 1000) {
              uh.pop(); // get rid of last entry before pushing a new entry
            }
          }
          uh.push([args.myViz.curInstr, curTs]);
        }
        return [false]; // pass through to let other hooks keep handling
      });
    }


    // 2014-05-25: implemented more detailed tracing for surveys
    this.myVisualizer.creationTime = new Date().getTime();
    // each element will be a two-element list consisting of:
    // [step number, timestamp]
    // (debounce entries that are less than 1 second apart to
    // compress the logs a bit when there's rapid scrubbing or scrolling)
    //
    // the first entry has a THIRD field:
    // [step number, timestamp, total # steps]
    //
    // subsequent entries don't need it since it will always be the same.
    // the invariant is that step number < total # steps (since it's
    // zero-indexed
    this.myVisualizer.updateHistory = [];
    this.myVisualizer.updateHistory.push([this.myVisualizer.curInstr,
                                          this.myVisualizer.creationTime,
                                          this.myVisualizer.curTrace.length]);
    /*
    if (typeof(activateSyntaxErrorSurvey) !== 'undefined' &&
        activateSyntaxErrorSurvey &&
        experimentalPopUpSyntaxErrorSurvey) {
      experimentalPopUpSyntaxErrorSurvey();
    }
    */
  }

  handleUncaughtException(trace) {
    if (trace.length == 1 && trace[0].line) {
      var errorLineNo = trace[0].line - 1; /* Ace lines are zero-indexed */
      if (errorLineNo !== undefined && errorLineNo != NaN) {
        // highlight the faulting line
        var s = this.pyInputAceEditor.getSession();
        s.setAnnotations([{row: errorLineNo,
                           column: null, /* for TS typechecking */
                           type: 'error',
                           text: trace[0].exception_msg}]);
        this.pyInputAceEditor.gotoLine(errorLineNo + 1 /* one-indexed */);
        // if we have both a line and column number, then move over to
        // that column. (going to the line first prevents weird
        // highlighting bugs)
        if (trace[0].col !== undefined) {
          this.pyInputAceEditor.moveCursorTo(errorLineNo, trace[0].col);
        }
        this.pyInputAceEditor.focus();
      }
    }

    var killerException = null;
    if (trace.length == 1) {
      killerException = trace[0];
    } else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
      killerException = trace[trace.length - 1];
    }

    if (killerException) {
      var excObj = {killerException: killerException, myAppState: this.getAppState()};
      this.prevExecutionExceptionObjLst.push(excObj);
    } else {
      this.prevExecutionExceptionObjLst = []; // reset!!!
    }
  }

  ignoreAjaxError(settings) {
    // other idiosyncratic errors to ignore
    if ((settings.url.indexOf('name_lookup.py') > -1) ||
        (settings.url.indexOf('syntax_err_survey.py') > -1) ||
        (settings.url.indexOf('viz_interaction.py') > -1)) {
      return true;
    }
    return false;
  }

  initDeltaObj() {
    assert(this.pyInputAceEditor);
    // v is the version number
    //   1 (version 1 was released on 2014-11-05)
    //   2 (version 2 was released on 2015-09-16, added a startTime field)
    this.deltaObj = {start: this.pyInputGetValue(), deltas: [], v: 2,
                     startTime: new Date().getTime()};
  }

  snapshotCodeDiff() {
    assert(this.deltaObj);
    var newCode = this.pyInputGetValue();
    var timestamp = new Date().getTime();

    if (this.curCode != newCode) {
      var diff = this.dmp.diff_toDelta(this.dmp.diff_main(this.curCode, newCode));
      //var patch = this.dmp.patch_toText(this.dmp.patch_make(this.curCode, newCode));
      var delta = {t: timestamp, d: diff};
      this.deltaObj.deltas.push(delta);

      this.curCode = newCode;
      this.logEditDelta(delta);
    }
  }

  logEditDelta(delta) {
    this.logEventCodeopticon({type: 'editCode', delta: delta});
  }

  enterDisplayMode() {
    this.updateAppDisplay('display');
  }

  enterEditMode() {
    this.updateAppDisplay('edit');
  }

  // try to make this function as idempotent as possible, so that
  // repeated calls with same params don't do anything bad
  updateAppDisplay(newAppMode) {
    this.appMode = newAppMode;

    if (this.appMode === undefined || this.appMode == 'edit' ||
        !this.myVisualizer /* subtle -- if no visualizer, default to edit mode */) {
      this.appMode = 'edit'; // canonicalize

      $("#pyInputPane").show();
      $("#pyOutputPane,#embedLinkDiv").hide();

      // Potentially controversial: when you enter edit mode, DESTROY any
      // existing visualizer object. note that this simplifies the app's
      // conceptual model but breaks the browser's expected Forward and
      // Back button flow
      $("#pyOutputPane").empty();
      // right before destroying, submit the visualizer's updateHistory
      this.submitUpdateHistory('editMode');
      this.myVisualizer = null; // yikes!

      $(document).scrollTop(0); // scroll to top to make UX better on small monitors

      var s: any = { mode: 'edit' };
      // keep these persistent so that they survive page reloads
      // keep these persistent so that they survive page reloads
      if (typeof codeopticonSession !== "undefined") {s.cosession = codeopticonSession;}
      if (typeof codeopticonUsername !== "undefined") {s.couser = codeopticonUsername;}
      $.bbq.pushState(s, 2 /* completely override other hash strings to keep URL clean */);
    } else if (this.appMode == 'display' || this.appMode == 'visualize' /* 'visualize' is deprecated */) {
      assert(this.myVisualizer);
      this.appMode = 'display'; // canonicalize

      $("#pyInputPane").hide();
      $("#pyOutputPane,#embedLinkDiv").show();

      this.doneExecutingCode();

      // do this AFTER making #pyOutputPane visible, or else
      // jsPlumb connectors won't render properly
      this.myVisualizer.updateOutput();

      // use .off() to remove all handlers first, to prevent accidental
      // multiple attaches ...

      // customize edit button click functionality AFTER rendering myVisualizer
      $('#pyOutputPane #editCodeLinkDiv').show();
      $('#pyOutputPane #editBtn').off().click(() => {
        this.enterEditMode();
      });
      var v = $('#pythonVersionSelector').val();
      if (v === 'js' || v === '2' || v === '3') {
        var myArgs = this.getAppState();
        var urlStr = $.param.fragment('live.html', myArgs, 2 /* clobber all */);
        $("#pyOutputPane #liveModeSpan").show();
        $('#pyOutputPane #editLiveModeBtn').off().click(this.openLiveModeUrl.bind(this));
      } else {
        $("#pyOutputPane #liveModeSpan").hide();
      }

      $(document).scrollTop(0); // scroll to top to make UX better on small monitors

      var s: any = { mode: 'display' };
      // keep these persistent so that they survive page reloads
      if (typeof codeopticonSession !== "undefined") {s.cosession = codeopticonSession;}
      if (typeof codeopticonUsername !== "undefined") {s.couser = codeopticonUsername;}
      $.bbq.pushState(s, 2 /* completely override other hash strings to keep URL clean */);
    } else {
      assert(false);
    }

    $('#urlOutput,#embedCodeOutput').val(''); // clear to avoid stale values

    // log at the end after appMode gets canonicalized
    this.logEventCodeopticon({type: 'updateAppDisplay', mode: this.appMode, appState: this.getAppState()});
    assert(this.appMode === 'edit' || this.appMode === 'display'); // postcondition
  }

  openLiveModeUrl() {
    var myArgs = this.getAppState();
    var urlStr = $.param.fragment('live.html', myArgs, 2 /* clobber all */);
    window.open(urlStr); // open in new tab
    return false; // to prevent default "a href" click action
  }

  appStateAugmenter(x) { }; // NOP

  // get the ENTIRE current state of the app
  getAppState() {
    assert(this.originFrontendJsFile);

    var ret = {code: this.pyInputGetValue(),
               mode: this.appMode,
               origin: this.originFrontendJsFile,
               cumulative: $('#cumulativeModeSelector').val(),
               heapPrimitives: $('#heapPrimitivesSelector').val(),
               textReferences: $('#textualMemoryLabelsSelector').val(),
               py: $('#pythonVersionSelector').val(),
               /* ALWAYS JSON serialize rawInputLst, even if it's empty! */
               rawInputLstJSON: JSON.stringify(this.rawInputLst),
               curInstr: this.myVisualizer ? this.myVisualizer.curInstr : undefined};

    // keep this really clean by avoiding undefined values
    if (ret.cumulative === undefined)
      delete ret.cumulative;
    if (ret.heapPrimitives === undefined)
      delete ret.heapPrimitives;
    if (ret.textReferences === undefined)
      delete ret.textReferences;
    if (ret.py === undefined)
      delete ret.py;
    if (ret.rawInputLstJSON === undefined)
      delete ret.rawInputLstJSON;
    if (ret.curInstr === undefined)
      delete ret.curInstr;

    // frontends can optionally AUGMENT the app state with custom fields
    this.appStateAugmenter(ret);
    return ret;
  }

  // strip it down to the bare minimum
  getToggleState() {
    var x = this.getAppState();
    delete x.code;
    delete x.mode;
    delete x.rawInputLstJSON;
    delete x.curInstr;
    return x;
  }

  setToggleOptions(dat) {
    // ugh, ugly tristate due to the possibility of each being undefined
    if (dat.py !== undefined) {
      $('#pythonVersionSelector').val(dat.py);
    }
    if (dat.cumulative !== undefined) {
      $('#cumulativeModeSelector').val(dat.cumulative);
    }
    if (dat.heapPrimitives !== undefined) {
      $('#heapPrimitivesSelector').val(dat.heapPrimitives);
    }
    if (dat.textReferences !== undefined) {
      $('#textualMemoryLabelsSelector').val(dat.textReferences);
    }
  }

  parseQueryString() {
    var queryStrOptions = this.getQueryStringOptions();
    this.setToggleOptions(queryStrOptions);
    if (queryStrOptions.preseededCode) {
      this.pyInputSetValue(queryStrOptions.preseededCode);
    }

    this.rawInputLst = queryStrOptions.rawInputLst ? queryStrOptions.rawInputLst : [];

    if (queryStrOptions.codeopticonSession) {
      assert(false); // TODO: this won't currently work with Webpack, so fix it later
      codeopticonSession = queryStrOptions.codeopticonSession; // GLOBAL defined in codeopticon-learner.js
      codeopticonUsername = queryStrOptions.codeopticonUsername; // GLOBAL defined in codeopticon-learner.js
    }

    if ((queryStrOptions.appMode == 'display' ||
         queryStrOptions.appMode == 'visualize' /* deprecated */) &&
        queryStrOptions.preseededCode /* jump to 'display' mode only with preseeded code */) {
      this.executeCode(queryStrOptions.preseededCurInstr); // will switch to 'display' mode
    }
    $.bbq.removeState(); // clean up the URL no matter what
  }

} // END class OptFrontend


export class OptFrontendSharedSessions extends OptFrontend {
  executeCodeSignalFromRemote = false;
  togetherjsSyncRequested = false;
  pendingCodeOutputScrollTop = null;
  updateOutputSignalFromRemote = false;

  constructor(params={}) {
    super(params);
    this.initTogetherJS();

    this.pyInputAceEditor.getSession().on("change", (e) => {
      // unfortunately, Ace doesn't detect whether a change was caused
      // by a setValue call
      if (TogetherJS.running) {
        TogetherJS.send({type: "codemirror-edit"});
      }
    });

    // NB: don't sync changeScrollTop for Ace since I can't get it working yet
    //this.pyInputAceEditor.getSession().on('changeScrollTop', () => {
    //  if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
    //    $.doTimeout('codeInputScroll', 100, function() { // debounce
    //      // note that this will send a signal back and forth both ways
    //      // (there's no easy way to prevent this), but it shouldn't keep
    //      // bouncing back and forth indefinitely since no the second signal
    //      // causes no additional scrolling
    //      TogetherJS.send({type: "codeInputScroll",
    //                       scrollTop: pyInputGetScrollTop()});
    //    });
    //  }
    //});

    // add an additional listener in addition to whatever the superclass/ added
    window.addEventListener("hashchange", (e) => {
      if (TogetherJS.running && !this.isExecutingCode) {
        TogetherJS.send({type: "hashchange",
                         appMode: this.appMode,
                         codeInputScrollTop: this.pyInputGetScrollTop(),
                         myAppState: this.getAppState()});
      }
    });
  }

  // important overrides to inject in pieces of TogetherJS functionality
  ignoreAjaxError(settings) {
    if (settings.url.indexOf('togetherjs') > -1) {
      return true;
    } else {
      return super.ignoreAjaxError(settings);
    }
  }

  setAceMode() {
    super.setAceMode();
    if (TogetherJS.running) {
      $("#liveModeBtn").hide();
    }
  }

  logEditDelta(delta) {
    super.logEditDelta(delta);
    if (TogetherJS.running) {
      TogetherJS.send({type: "editCode", delta: delta});
    }
  }

  startExecutingCode(startingInstruction=0) {
    if (TogetherJS.running && !this.executeCodeSignalFromRemote) {
      TogetherJS.send({type: "executeCode",
                       myAppState: this.getAppState(),
                       forceStartingInstr: startingInstruction,
                       rawInputLst: this.rawInputLst});
    }

    super.startExecutingCode(startingInstruction);
  }

  updateAppDisplay(newAppMode) {
    super.updateAppDisplay(newAppMode); // do this first!

    // now this.appMode should be canonicalized to either 'edit' or 'display'
    if (this.appMode === 'edit') {
      // pass
    } else if (this.appMode === 'display') {
      assert(this.myVisualizer);

      if (TogetherJS.running) {
        $("#pyOutputPane #liveModeSpan").hide();
      } else {
        $("#surveyHeader").show();
      }

      if (this.pendingCodeOutputScrollTop) {
        this.myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(this.pendingCodeOutputScrollTop);
        this.pendingCodeOutputScrollTop = null;
      }

      $.doTimeout('pyCodeOutputDivScroll'); // cancel any prior scheduled calls

      // TODO: this might interfere with experimentalPopUpSyntaxErrorSurvey (2015-04-19)
      this.myVisualizer.domRoot.find('#pyCodeOutputDiv').scroll(function(e) {
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
    } else {
      assert(false);
    }
  }

  finishSuccessfulExecution() {
    assert (this.myVisualizer);

    this.myVisualizer.add_pytutor_hook("end_updateOutput", (args) => {
      if (this.updateOutputSignalFromRemote) {
        return [true]; // die early; no more hooks should run after this one!
      }

      if (TogetherJS.running && !this.isExecutingCode) {
        TogetherJS.send({type: "updateOutput", step: args.myViz.curInstr});
      }
      return [false]; // pass through to let other hooks keep handling
    });

    // do this late since we want the hook in this function to be installed
    // FIRST so that it can run before the hook installed by our superclass
    super.finishSuccessfulExecution();

    // VERY SUBTLE -- reinitialize TogetherJS at the END so that it can detect
    // and sync any new elements that are now inside myVisualizer
    if (TogetherJS.running) {
      TogetherJS.reinitialize();
    }
  }


  initTogetherJS() {
    assert(TogetherJS);

    if (togetherjsInUrl) { // kinda gross global
      $("#ssDiv,#surveyHeader,#adHeader").hide(); // hide ASAP!
      $("#togetherjsStatus").html("Please wait ... loading shared session");
    }

    // clear your name from the cache every time to prevent privacy leaks
    if (supports_html5_storage()) {
      localStorage.removeItem('togetherjs.settings.name');
    }

    // This event triggers when you first join a session and say 'hello',
    // and then one of your peers says hello back to you. If they have the
    // exact same name as you, then change your own name to avoid ambiguity.
    // Remember, they were here first (that's why they're saying 'hello-back'),
    // so they keep their own name, but you need to change yours :)
    TogetherJS.hub.on("togetherjs.hello-back", (msg) => {
      if (!msg.sameUrl) return; // make sure we're on the same page
      var p = TogetherJS.require("peers");

      var peerNames = p.getAllPeers().map(e => e.name);

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

    TogetherJS.hub.on("updateOutput", (msg) => {
      if (!msg.sameUrl) return; // make sure we're on the same page
      if (this.isExecutingCode) {
        return;
      }

      if (this.myVisualizer) {
        // to prevent this call to updateOutput from firing its own TogetherJS event
        this.updateOutputSignalFromRemote = true;
        try {
          this.myVisualizer.renderStep(msg.step);
        }
        finally {
          this.updateOutputSignalFromRemote = false;
        }
      }
    });

    TogetherJS.hub.on("executeCode", (msg) => {
      if (!msg.sameUrl) return; // make sure we're on the same page
      if (this.isExecutingCode) {
        return;
      }

      this.executeCodeSignalFromRemote = true;
      try {
        this.executeCode(msg.forceStartingInstr, msg.rawInputLst);
      }
      finally {
        this.executeCodeSignalFromRemote = false;
      }
    });

    TogetherJS.hub.on("hashchange", (msg) => {
      if (!msg.sameUrl) return; // make sure we're on the same page
      if (this.isExecutingCode) {
        return;
      }

      console.log("TogetherJS RECEIVE hashchange", msg.appMode);
      if (msg.appMode != this.appMode) {
        this.updateAppDisplay(msg.appMode);

        if (this.appMode == 'edit' && msg.codeInputScrollTop !== undefined &&
            this.pyInputGetScrollTop() != msg.codeInputScrollTop) {
          // hack: give it a bit of time to settle first ...
          $.doTimeout('pyInputCodeMirrorInit', 200, () => {
            this.pyInputSetScrollTop(msg.codeInputScrollTop);
          });
        }
      }
    });

    TogetherJS.hub.on("codemirror-edit", (msg) => {
      if (!msg.sameUrl) return; // make sure we're on the same page
      $("#codeInputWarnings").hide();
      $("#someoneIsTypingDiv").show();

      $.doTimeout('codeMirrorWarningTimeout', 500, () => { // debounce
        $("#codeInputWarnings").show();
        $("#someoneIsTypingDiv").hide();
      });
    });

    TogetherJS.hub.on("requestSync", (msg) => {
      // DON'T USE msg.sameUrl check here since it doesn't work properly, eek!
      TogetherJS.send({type: "myAppState",
                       myAppState: this.getAppState(),
                       codeInputScrollTop: this.pyInputGetScrollTop(),
                       pyCodeOutputDivScrollTop: this.myVisualizer ?
                                                 this.myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop() :
                                                 undefined});
    });

    TogetherJS.hub.on("myAppState", (msg) => {
      // DON'T USE msg.sameUrl check here since it doesn't work properly, eek!

      // if we didn't explicitly request a sync, then don't do anything
      if (!this.togetherjsSyncRequested) {
        return;
      }

      this.togetherjsSyncRequested = false;

      var learnerAppState = msg.myAppState;

      if (learnerAppState.mode == 'display') {
        if (OptFrontendSharedSessions.appStateEq(this.getAppState(), learnerAppState)) {
          // update curInstr only
          console.log("on:myAppState - app states equal, renderStep", learnerAppState.curInstr);
          this.myVisualizer.renderStep(learnerAppState.curInstr);

          if (msg.pyCodeOutputDivScrollTop !== undefined) {
            this.myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(msg.pyCodeOutputDivScrollTop);
          }
        } else if (!this.isExecutingCode) { // if already executing from a prior signal, ignore
          console.log("on:myAppState - app states unequal, executing", learnerAppState);
          this.syncAppState(learnerAppState);

          this.executeCodeSignalFromRemote = true;
          try {
            if (msg.pyCodeOutputDivScrollTop !== undefined) {
              this.pendingCodeOutputScrollTop = msg.pyCodeOutputDivScrollTop;
            }
            this.executeCode(learnerAppState.curInstr);
          }
          finally {
            this.executeCodeSignalFromRemote = false;
          }
        }
      } else {
        assert(learnerAppState.mode == 'edit');
        if (!OptFrontendSharedSessions.appStateEq(this.getAppState(), learnerAppState)) {
          console.log("on:myAppState - edit mode sync");
          this.syncAppState(learnerAppState);
          this.enterEditMode();
        }
      }

      if (msg.codeInputScrollTop !== undefined) {
        // give pyInputAceEditor a bit of time to settle with
        // its new value. this is hacky; ideally we have a callback for
        // when setValue() completes.
        $.doTimeout('pyInputCodeMirrorInit', 200, () => {
          this.pyInputSetScrollTop(msg.codeInputScrollTop);
        });
      }
    });

    TogetherJS.hub.on("syncAppState", (msg) => {
      if (!msg.sameUrl) return; // make sure we're on the same page
      this.syncAppState(msg.myAppState);
    });

    TogetherJS.hub.on("codeInputScroll", (msg) => {
      if (!msg.sameUrl) return; // make sure we're on the same page
      // don't sync for Ace editor since I can't get it working properly yet
    });

    TogetherJS.hub.on("pyCodeOutputDivScroll", (msg) => {
      if (!msg.sameUrl) return; // make sure we're on the same page
      if (this.myVisualizer) {
        this.myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(msg.scrollTop);
      }
    });

    $("#sharedSessionBtn").click(this.startSharedSession.bind(this));
    $("#stopTogetherJSBtn").click(TogetherJS); // toggles off

    // fired when TogetherJS is activated. might fire on page load if there's
    // already an open session from a prior page load in the recent past.
    TogetherJS.on("ready", () => {
      console.log("TogetherJS ready");

      $("#sharedSessionDisplayDiv").show();
      $("#adInfo,#ssDiv,#adHeader,#testCasesParent,#liveModeBtn,#pyOutputPane #liveModeSpan").hide();

      // send this to the server for the purposes of logging, but other
      // clients shouldn't do anything with this data
      if (TogetherJS.running) {
        TogetherJS.send({type: "initialAppState",
                         myAppState: this.getAppState(),
                         user_uuid: supports_html5_storage() ? localStorage.getItem('opt_uuid') : undefined,
                         // so that you can tell whether someone else
                         // shared a TogetherJS URL with you to invite you
                         // into this shared session:
                         togetherjsInUrl: togetherjsInUrl}); // kinda gross global
      }

      this.requestSync(); // immediately try to sync upon startup so that if
                          // others are already in the session, we will be
                          // synced up. and if nobody is here, then this is a NOP.

      this.TogetherjsReadyHandler();
      this.redrawConnectors(); // update all arrows at the end
    });

    // emitted when TogetherJS is closed. This is not emitted when the
    // webpage simply closes or navigates elsewhere, ONLY when TogetherJS
    // is explicitly stopped via a call to TogetherJS()
    TogetherJS.on("close", () => {
      console.log("TogetherJS close");

      $("#togetherjsStatus").html(''); // clear it
      $("#sharedSessionDisplayDiv").hide();
      $("#adInfo,#ssDiv,#adHeader,#testCasesParent").show();

      this.TogetherjsCloseHandler();
      this.redrawConnectors(); // update all arrows at the end
    });
  }

  requestSync() {
    if (TogetherJS.running) {
      this.togetherjsSyncRequested = true;
      TogetherJS.send({type: "requestSync"});
    }
  }

  syncAppState(appState) {
    this.setToggleOptions(appState);

    // VERY VERY subtle -- temporarily prevent TogetherJS from sending
    // form update events while we set the input value. otherwise
    // this will send an incorrect delta to the other end and screw things
    // up because the initial states of the two forms aren't equal.
    var orig = TogetherJS.config.get('ignoreForms');
    TogetherJS.config('ignoreForms', true);
    this.pyInputSetValue(appState.code);
    TogetherJS.config('ignoreForms', orig);

    if (appState.rawInputLst) {
      this.rawInputLst = $.parseJSON(appState.rawInputLstJSON);
    } else {
      this.rawInputLst = [];
    }
  }

  TogetherjsReadyHandler() {
    $("#surveyHeader").hide();
    this.populateTogetherJsShareUrl();
  }

  TogetherjsCloseHandler() {
    if (this.appMode === "display") {
      $("#surveyHeader").show();
    }
  }

  startSharedSession() {
    $("#ssDiv,#surveyHeader,#adHeader").hide(); // hide ASAP!
    $("#togetherjsStatus").html("Please wait ... loading shared session");
    TogetherJS();
  }

  // return whether two states match, except don't worry about curInstr
  static appStateEq(s1, s2) {
    assert(s1.origin == s2.origin); // sanity check!

    return (s1.code == s2.code &&
            s1.mode == s2.mode &&
            s1.cumulative == s2.cumulative &&
            s1.heapPrimitives == s1.heapPrimitives &&
            s1.textReferences == s2.textReferences &&
            s1.py == s2.py &&
            s1.rawInputLstJSON == s2.rawInputLstJSON);
  }

  populateTogetherJsShareUrl() {
    // without anything after the '#' in the hash
    var cleanUrl = $.param.fragment(location.href, {}, 2); // 2 means 'override'

    var shareId = TogetherJS.shareId();
    assert(shareId); // make sure we're not attempting to access shareId before it's set

    var urlToShare = cleanUrl + 'togetherjs=' + shareId;
    $("#togetherjsStatus").html('<div>\
                                 Send the URL below to invite someone to join this shared session:\
                                 </div>\
                                 <input type="text" style="font-size: 10pt; \
                                 font-weight: bold; padding: 4px;\
                                 margin-top: 3pt; \
                                 margin-bottom: 6pt;" \
                                 id="togetherjsURL" size="80" readonly="readonly"/>');

    var extraHtml = '<div style="margin-top: 3px; margin-bottom: 10px; font-size: 8pt;">For best results, do not click or move around too quickly, and press "Force sync" if you get out of sync: <button id="syncBtn" type="button">Force sync</button><br/><a href="https://docs.google.com/forms/d/126ZijTGux_peoDusn1F9C1prkR226897DQ0MTTB5Q4M/viewform" target="_blank">Report bugs and feedback</a> on this shared sessions feature.</div>'
    $("#togetherjsStatus").append(extraHtml);

    $("#togetherjsURL").val(urlToShare).attr('size', urlToShare.length + 20);
    $("#syncBtn").click(this.requestSync.bind(this));
  }
} // END class OptFrontendSharedSessions


// augmented with a "Create test cases" pane
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
