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

*/


// for TypeScript
declare var initCodeopticon: any; // FIX later when porting Codeopticon
declare var codeopticonUsername: string; // FIX later when porting Codeopticon
declare var codeopticonSession: string;  // FIX later when porting Codeopticon

require('./lib/jquery-3.0.0.min.js');

// just punt and use global script dependencies
require("script-loader!./lib/ace/src-min-noconflict/ace.js");
require('script-loader!./lib/ace/src-min-noconflict/mode-python.js');
require('script-loader!./lib/ace/src-min-noconflict/mode-javascript.js');
require('script-loader!./lib/ace/src-min-noconflict/mode-typescript.js');
require('script-loader!./lib/ace/src-min-noconflict/mode-c_cpp.js');
require('script-loader!./lib/ace/src-min-noconflict/mode-java.js');
require('script-loader!./lib/ace/src-min-noconflict/mode-ruby.js');

require('script-loader!./lib/socket.io-client/socket.io.js');

// need to directly import the class for type checking to work
import {AbstractBaseFrontend, generateUUID, supports_html5_storage} from './opt-frontend-common';
import {ExecutionVisualizer, assert, htmlspecialchars} from './pytutor';

require('../css/opt-frontend.css');
require('../css/opt-testcases.css');

export const allTabsRE = new RegExp('\t', 'g');


const JAVA_BLANK_TEMPLATE = `public class YourClassNameHere {
    public static void main(String[] args) {

    }
}`;

const CPP_BLANK_TEMPLATE = `int main() {

  return 0;
}`;

const CODE_SNAPSHOT_DEBOUNCE_MS = 1000;
const SUBMIT_UPDATE_HISTORY_INTERVAL_MS = 1000 * 60;

function sanitizeURL(s) {
  return s.replace(/\(/g, '%28').replace(/\)/g, '%29'); // replace ( with %28 and ) with %29 so that links embed well in Markdown and email clients
}


export class OptFrontend extends AbstractBaseFrontend {
  originFrontendJsFile: string = 'opt-frontend.js';
  pyInputAceEditor = undefined; // Ace editor object that contains the user's code

  // some subclasses use these, so put them in the superclass
  activateSyntaxErrorSurvey: boolean = true;
  activateRuntimeErrorSurvey: boolean = true;
  activateEurekaSurvey: boolean = true;

  demoMode: boolean = false; // if true, then we're giving a live demo, so hide a bunch of excess stuff on page
  codcastFile: string; // name of a codcast demo file to try to load

  preseededCurInstr: number = undefined;

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
      embedUrlStr = sanitizeURL(embedUrlStr);
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
      urlStr = sanitizeURL(urlStr);
      $('#urlOutput').val(urlStr);
    });

    $('#genUrlShortenedBtn').bind('click', () => {
      var myArgs = this.getAppState();
      var urlStr = $.param.fragment(window.location.href, myArgs, 2); // 2 means 'override'
      urlStr = sanitizeURL(urlStr);
      // call goo.gl URL shortener
      //
      // to test this API from command-line, first disable the IP restriction on API credentials, then run:
      // curl https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyCIjtNqfABbRilub1a3Ta7-qKF3bS9_p1M -H 'Content-Type: application/json' -d '{"longUrl": "http://www.google.com/"}'
      $.ajax('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyCIjtNqfABbRilub1a3Ta7-qKF3bS9_p1M',
             {type: 'POST',
             contentType: 'application/json',
             data: JSON.stringify({longUrl: urlStr}), // encode as a string first! #tricky
             success: function(dat) {
               $("#urlOutputShortened").val(dat.id);
             },
             error: function() {
               $("#urlOutputShortened").val("Error in URL shortener :(");
             }
             });
    });

    $("#instructionsPane").html(`Advanced instructions:
      <a href="https://www.youtube.com/watch?v=80ztTXP90Vs&list=PLzV58Zm8FuBL2WxxZKGZ6j1dH8NKb_HYI&index=5" target="_blank">setting breakpoints</a> |
      <a href="https://www.youtube.com/watch?v=Mxt9HZWgwAM&list=PLzV58Zm8FuBL2WxxZKGZ6j1dH8NKb_HYI&index=6" target="_blank">hiding variables</a> |
      <a href="https://www.youtube.com/watch?v=JjGt95Te0wo&index=3&list=PLzV58Zm8FuBL2WxxZKGZ6j1dH8NKb_HYI" target="_blank">live programming</a>`);

    // first initialize options from HTML LocalStorage. very important
    // that this code runs FIRST so that options get overridden by query
    // string options and anything else the user wants to override with.
    if (supports_html5_storage() && !(params as any).disableLocalStorageToggles) {
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
                         user_uuid: this.userUUID,
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
      // 2017-11-21: convert all tabs to 4 spaces so that when you paste
      // in code from somewhere else that contains tabs, instantly
      // change all those tabs to spaces. note that all uses of 'tab' key
      // within the Ace editor on this page will result in spaces (i.e.,
      // "soft tabs")
      var curVal = this.pyInputGetValue();
      if (curVal.indexOf('\t') >= 0) {
        this.pyInputSetValue(curVal.replace(allTabsRE, '    '));
        console.log("Converted all tabs to spaces");
      }

      $.doTimeout('pyInputAceEditorChange', CODE_SNAPSHOT_DEBOUNCE_MS, this.snapshotCodeDiff.bind(this)); // debounce

      // starting on 2018-03-14 -- do NOT clear frontend errors and
      // annotations when you edit the code, since you may still want to
      // see the old error messages ... commented out these two lines:
      //this.clearFrontendError();
      //s.clearAnnotations();
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
      assert(selectorVal === '2' || selectorVal == '3' || selectorVal == 'py3anaconda')
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
    $('#urlOutput,#urlOutputShortened,#embedCodeOutput').val('');
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
      this.setFronendError(["Type in some code to visualize."], true);
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
  }

  ignoreAjaxError(settings) {
    // other idiosyncratic errors to ignore
    if ((settings.url.indexOf('syntax_err_survey.py') > -1) ||
        (settings.url.indexOf('runtime_err_survey.py') > -1) ||
        (settings.url.indexOf('eureka_survey.py') > -1) ||
        (settings.url.indexOf('error_log.py') > -1) ||
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

      // *after* the editor is shown, force it to refresh its contents
      // (using the misleadingly-named resize(true) method)
      this.pyInputAceEditor.resize(true);

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

      // 2018-03-15 - removed "Live programming" link from
      // visualization mode to simplify the UI, even if it drives
      // fewer people to live programming mode; they can always click
      // the "Live Programming Mode" button in the code editor:
      /*
      if (v === 'js' || v === '2' || v === '3') {
        var myArgs = this.getAppState();
        var urlStr = $.param.fragment('live.html', myArgs, 2); // clobber all
        $("#pyOutputPane #liveModeSpan").show();
        $('#pyOutputPane #editLiveModeBtn').off().click(this.openLiveModeUrl.bind(this));
      } else {
        $("#pyOutputPane #liveModeSpan").hide();
      }
      */

      $(document).scrollTop(0); // scroll to top to make UX better on small monitors

      var s: any = { mode: 'display' };
      // keep these persistent so that they survive page reloads
      if (typeof codeopticonSession !== "undefined") {s.cosession = codeopticonSession;}
      if (typeof codeopticonUsername !== "undefined") {s.couser = codeopticonUsername;}
      $.bbq.pushState(s, 2 /* completely override other hash strings to keep URL clean */);
    } else {
      assert(false);
    }

    $('#urlOutput,#urlOutputShortened,#embedCodeOutput').val(''); // clear to avoid stale values

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

  demoModeChanged() {}; // NOP; subclasses need to override
  loadCodcastFile() {}; // NOP; subclasses need to override

  parseQueryString() {
    var queryStrOptions = this.getQueryStringOptions();
    this.setToggleOptions(queryStrOptions);
    if (queryStrOptions.preseededCode) {
      this.pyInputSetValue(queryStrOptions.preseededCode);
    }

    this.rawInputLst = queryStrOptions.rawInputLst ? queryStrOptions.rawInputLst : [];
    this.preseededCurInstr = queryStrOptions.preseededCurInstr;
    if (isNaN(this.preseededCurInstr)) {
      this.preseededCurInstr = undefined;
    }

    if (queryStrOptions.demoMode) {
      this.demoMode = true;
      this.demoModeChanged();
    }

    if (queryStrOptions.codcastFile) {
      this.codcastFile = queryStrOptions.codcastFile;
      this.loadCodcastFile();
    }

    if (queryStrOptions.codeopticonSession) {
      assert(false); // TODO: this won't currently work with Webpack, so fix it later
      codeopticonSession = queryStrOptions.codeopticonSession; // GLOBAL defined in codeopticon-learner.js
      codeopticonUsername = queryStrOptions.codeopticonUsername; // GLOBAL defined in codeopticon-learner.js
    }

    if ((queryStrOptions.appMode == 'display' ||
         queryStrOptions.appMode == 'visualize' /* deprecated */) &&
        queryStrOptions.preseededCode /* jump to 'display' mode only with preseeded code */) {
      this.executeCode(this.preseededCurInstr); // will switch to 'display' mode
    }
    $.bbq.removeState(); // clean up the URL no matter what
  }

} // END class OptFrontend
