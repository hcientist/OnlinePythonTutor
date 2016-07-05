// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

/* TODO

- figure out how to avoid unnecessary duplication with opt-live.js

- we're always referring to top-level CSS selectors on the page; maybe
  use a this.domRoot pattern like in pytutor.ts?

- NB: i moved the shared sessions stuff into cruft/shared-sessions.js

- test session_uuid, user_uuid, and other stuff stored to localStorage

*/

/// <reference path="_references.ts" />

// for TypeScript
declare var TogetherJS: any;
declare var TogetherJSConfig_ignoreForms: any;
declare var diff_match_patch: any;
declare var codeopticonUsername: string; // FIX later when porting Codeopticon
declare var codeopticonSession: string;  // FIX later when porting Codeopticon


require('./lib/diff_match_patch.js');
require('./lib/jquery.ba-dotimeout.min.js');

var pytutor = require('./pytutor.ts');
var assert = pytutor.assert;


// constants
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

// these settings are all customized for my own server setup,
// so you will need to customize for your server:
const serverRoot = (window.location.protocol === 'https:') ?
                    'https://cokapi.com:8001/' : // my certificate for https is registered via cokapi.com, so use it for now
                    'http://104.237.139.253:3000/';

export const JS_JSONP_ENDPOINT = serverRoot + 'exec_js_jsonp'; // TODO: get rid of this dependency in opt-live.ts

// note that we use '2' and '3' instead of 'py2' and 'py3' due to legacy reasons
const langSettingToBackendScript = {
  // backend scripts to execute (Python 2 and 3 variants, if available)
  // make two copies of ../web_exec.py and give them the following names,
  // then change the first line (starting with #!) to the proper version
  // of the Python interpreter (i.e., Python 2 or Python 3).
  // Note that your hosting provider might have stringent rules for what
  // kind of scripts are allowed to execute. For instance, my provider
  // (Webfaction) seems to let scripts execute only if permissions are
  // something like:
  // -rwxr-xr-x 1 pgbovine pgbovine 2.5K Jul  5 22:46 web_exec_py2.py*
  // (most notably, only the owner of the file should have write
  //  permissions)
  '2': 'web_exec_py2.py',
  '3': 'web_exec_py3.py',

  // empty dummy scripts just to do logging on Apache server
  'js':   'web_exec_js.py',
  'ts':   'web_exec_ts.py',
  'java': 'web_exec_java.py',
  'ruby': 'web_exec_ruby.py',
  'c':   'web_exec_c.py',
  'cpp': 'web_exec_cpp.py',
};

// see ../../v4-cokapi/cokapi.js for details
const langSettingToJsonpEndpoint = {
  '2':    null,
  '3':    null,
  'js':   serverRoot + 'exec_js_jsonp',
  'ts':   serverRoot + 'exec_ts_jsonp',
  'java': serverRoot + 'exec_java_jsonp',
  'ruby': serverRoot + 'exec_ruby_jsonp',
  'c':    serverRoot + 'exec_c_jsonp',
  'cpp':  serverRoot + 'exec_cpp_jsonp',
};


// for shared sessions ... put back in later
var updateOutputSignalFromRemote = false;
var executeCodeSignalFromRemote = false;
var togetherjsSyncRequested = false;
var pendingCodeOutputScrollTop = null;


// the main event!
//
// NB: this still relies on global state such as localStorage and the
// browser URL hash string, so you can't quite have more than one
// of these objects per page; it still should be instantiated as a singleton
//
// this should also be treated like an Abstract Base Class
export abstract class AbstractBaseFrontend {
  sessionUUID: string = generateUUID(); // remains constant throughout one page load ("session")

  myVisualizer; // singleton ExecutionVisualizer instance from pytutor.ts
  originFrontendJsFile: string; // "abstract" -- must override in subclass

  // 'edit' or 'display'. also support 'visualize' for backward
  // compatibility (same as 'display')
  appMode: string = 'edit';

  // inputted by user for raw_input / mouse_input events
  rawInputLst: string[] = [];

  isExecutingCode: boolean = false;

  pyInputAceEditor; // Ace editor object that contains the input code

  dmp = new diff_match_patch();
  curCode = ''; // for dmp snapshots, kinda kludgy
  deltaObj : {start: string, deltas: any[], v: number, startTime: number, executeTime?: number} = undefined;

  num414Tries = 0;

  constructor(params: any = {}) {
    // optional params -- TODO: handle later
    /*
    if (params.TogetherjsReadyHandler) {
      TogetherjsReadyHandler = params.TogetherjsReadyHandler;
    }
    if (params.TogetherjsCloseHandler) {
      TogetherjsCloseHandler = params.TogetherjsCloseHandler;
    }
    if (params.startSharedSession) {
      startSharedSession = params.startSharedSession;
    }
    */
    if (params.initAceEditor) { // weird function overriding; maybe make it a subclassable field?
      this.initAceEditor = params.initAceEditor;
    }
    if (params.appStateAugmenter) {
      this.appStateAugmenter = params.appStateAugmenter;
    }
    if (params.loadTestCases) {
      this.loadTestCases = params.loadTestCases;
    }

    //initTogetherJS(); // initialize early but after initializeFrontendParams -- TODO: rethink

    $(window).bind("hashchange", function(e) {
      // if you've got some preseeded code, then parse the entire query
      // string from scratch just like a page reload
      if ($.bbq.getState('code')) {
        this.parseQueryString();
      } else {
        // otherwise just do an incremental update
        var newMode = $.bbq.getState('mode');
        //console.log('hashchange:', newMode, window.location.hash);
        this.updateAppDisplay(newMode);
      }

      if (typeof TogetherJS !== 'undefined' && TogetherJS.running && !this.isExecutingCode) {
        TogetherJS.send({type: "hashchange",
                         appMode: this.appMode,
                         codeInputScrollTop: this.pyInputGetScrollTop(),
                         myAppState: this.getAppState()});
      }
    });

    this.initAceEditor(420);
    this.pyInputAceEditor.getSession().on("change", (e) => {
      // unfortunately, Ace doesn't detect whether a change was caused
      // by a setValue call
      if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
        TogetherJS.send({type: "codemirror-edit"});
      }
    });

    // NB: don't sync changeScrollTop for Ace since I can't get it working yet
    //pyInputAceEditor.getSession().on('changeScrollTop', () => {
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

      // generate a unique UUID per "user" (as indicated by a single browser
      // instance on a user's machine, which can be more precise than IP
      // addresses due to sharing of IP addresses within, say, a school
      // computer lab)
      // added on 2015-01-27 for more precise user identification
      if (!localStorage.getItem('opt_uuid')) {
        localStorage.setItem('opt_uuid', generateUUID());
      }
    }

    this.parseQueryString();

    $(window).resize(this.redrawConnectors.bind(this));

    $('#genUrlBtn').bind('click', () => {
      var myArgs = this.getAppState();
      var urlStr = $.param.fragment(window.location.href, myArgs, 2); // 2 means 'override'
      urlStr = urlStr.replace(/\)/g, '%29') // replace ) with %29 so that links embed well in Markdown
      $('#urlOutput').val(urlStr);
    });

    // register a generic AJAX error handler
    $(document).ajaxError(function(evt, jqxhr, settings, exception) {
      // ignore errors related to togetherjs stuff:
      if (settings.url.indexOf('togetherjs') > -1) {
        return; // get out early
      }

      // ugh other idiosyncratic errors to ignore
      if ((settings.url.indexOf('name_lookup.py') > -1) ||
          (settings.url.indexOf('syntax_err_survey.py') > -1) ||
          (settings.url.indexOf('viz_interaction.py') > -1)) {
        return; // get out early
      }

      // On my server ...

      // This jqxhr.responseText might mean the URL is too long, since the error
      // message returned by the server is something like this in nginx:
      //
      //   <html>
      //   <head><title>414 Request-URI Too Large</title></head>
      //   <body bgcolor="white">
      //   <center><h1>414 Request-URI Too Large</h1></center>
      //   <hr><center>nginx</center>
      //   </body>
      //   </html>
      //
      // Note that you'll probably need to customize this check for your server.
      if (jqxhr && jqxhr.responseText.indexOf('414') >= 0) {
        // ok this is an UBER UBER hack. If this happens just once, then
        // force click the "Visualize Execution" button again and re-try.
        // why? what's the difference the second time around? the diffs_json
        // parameter (derived from deltaObj) will be *empty* the second time
        // around since it gets reset on every execution. if diffs_json is
        // HUGE, then that might force the URL to be too big without your
        // code necessarily being too big, so give it a second shot with an
        // empty diffs_json. if it STILL fails, then display the error
        // message and give up.
        if (this.num414Tries === 0) {
          this.num414Tries++;
          this.startExecutingCode(); // TODO: does this work?
          $("#executeBtn").click();
        } else {
          this.num414Tries = 0;
          this.setFronendError(["Server error! Your code might be too long for this tool. Shorten your code and re-try."]);
        }
      } else {
        this.setFronendError(
                        ["Server error! Your code might be taking too much time to run or using too much memory.",
                         "Report a bug to philip@pgbovine.net by clicking the 'Generate permanent link' button",
                         "at the bottom of this page and including a URL in your email."]);
      }
      this.doneExecutingCode();
    });

    this.clearFrontendError();

    $("#embedLinkDiv").hide();
    $("#executeBtn").attr('disabled', false);
    $("#executeBtn").click(this.executeCodeFromScratch.bind(this));

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
    setInterval(function() {
      if (this.myVisualizer) {
        var uh = this.myVisualizer.updateHistory;
        // don't submit identical entries repeatedly since that's redundant
        if (uh && (uh.length != lastSubmittedUpdateHistoryLength)) {
          lastSubmittedUpdateHistoryLength = uh.length;
          this.submitUpdateHistory('periodic');
        }
      }
    }, SUBMIT_UPDATE_HISTORY_INTERVAL_MS);
  }

  abstract executeCode(forceStartingInstr?: number, forceRawInputLst?: string[]) : any;
  appStateAugmenter(appState) { } // NOP
  loadTestCases(testCasesLst) { } // NOP

  redrawConnectors() {
    if (this.myVisualizer &&
        (this.appMode == 'display' ||
         this.appMode == 'visualize' /* deprecated */)) {
      this.myVisualizer.redrawConnectors();
    }
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

  setFronendError(lines) {
    $("#frontendErrorOutput").html(lines.map(pytutor.htmlspecialchars).join('<br/>'));
  }

  clearFrontendError() {
    $("#frontendErrorOutput").html('');
  }

  initDeltaObj() {
    // make sure the editor already exists
    // (editor doesn't exist when you're, say, doing an iframe embed)
    if (!this.pyInputAceEditor) {
      return;
    }

    // v is the version number
    //   1 (version 1 was released on 2014-11-05)
    //   2 (version 2 was released on 2015-09-16, added a startTime field)
    this.deltaObj = {start: this.pyInputGetValue(), deltas: [], v: 2,
                     startTime: new Date().getTime()};
  }

  initAceEditor(height: number) {
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

    // TODO: we're referring to top-level CSS selectors on the page;
    // maybe use a this.domRoot pattern like in pytutor.ts?
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

    this.clearFrontendError();
  }

  snapshotCodeDiff() {
    assert(this.deltaObj);
    var newCode = this.pyInputGetValue();
    var timestamp = new Date().getTime();

    //console.log('Orig:', curCode);
    //console.log('New:', newCode);
    if (this.curCode != newCode) {
      var diff = this.dmp.diff_toDelta(this.dmp.diff_main(this.curCode, newCode));
      //var patch = this.dmp.patch_toText(this.dmp.patch_make(this.curCode, newCode));
      var delta = {t: timestamp, d: diff};
      this.deltaObj.deltas.push(delta);

      this.curCode = newCode;
      logEventCodeopticon({type: 'editCode', delta: delta});

      if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
        TogetherJS.send({type: "editCode", delta: delta});
      }
    }
  }

  getBaseBackendOptionsObj() {
    var ret = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
               heap_primitives: ($('#heapPrimitivesSelector').val() == 'true'),
               show_only_outputs: false,
               origin: this.originFrontendJsFile};
    return ret;
  }

  getBaseFrontendOptionsObj() {
    var ret = {// tricky: selector 'true' and 'false' values are strings!
                disableHeapNesting: ($('#heapPrimitivesSelector').val() == 'true'),
                textualMemoryLabels: ($('#textualMemoryLabelsSelector').val() == 'true'),
                executeCodeWithRawInputFunc: this.executeCodeWithRawInput.bind(this),

                // always use the same visualizer ID for all
                // instantiated ExecutionVisualizer objects,
                // so that they can sync properly across
                // multiple clients using TogetherJS. this
                // shouldn't lead to problems since only ONE
                // ExecutionVisualizer will be shown at a time
                visualizerIdOverride: '1',
                updateOutputCallback: function() {$('#urlOutput,#embedCodeOutput').val('');},
                startingInstruction: 0,
              };
    return ret;
  }

  executeCodeFromScratch() {
    // don't execute empty string:
    if (this.pyInputAceEditor && $.trim(this.pyInputGetValue()) == '') {
      this.setFronendError(["Type in some code to visualize."]);
      return;
    }

    this.rawInputLst = []; // reset!
    this.executeCode();
  }

  executeCodeWithRawInput(rawInputStr, curInstr) {
    this.rawInputLst.push(rawInputStr);
    console.log('executeCodeWithRawInput', rawInputStr, curInstr, this.rawInputLst);
    this.executeCode(curInstr);
  }

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

    // different frontends can optionally AUGMENT the app state with
    // custom fields
    if (this.appStateAugmenter) {
      this.appStateAugmenter(ret);
    }
    return ret;
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

  // strip it down to the bare minimum
  getToggleState() {
    var x = this.getAppState();
    delete x.code;
    delete x.mode;
    delete x.rawInputLstJSON;
    delete x.curInstr;
    return x;
  }

  startExecutingCode() {
    $('#executeBtn').html("Please wait ... executing (takes up to 10 seconds)");
    $('#executeBtn').attr('disabled', true);
    this.isExecutingCode = true;
  }

  doneExecutingCode() {
    $('#executeBtn').html("Visualize Execution");
    $('#executeBtn').attr('disabled', false);
    this.isExecutingCode = false;
  }

  enterDisplayMode() {
    this.updateAppDisplay('display');
  }

  enterEditMode() {
    this.updateAppDisplay('edit');
  }

  optFinishSuccessfulExecution() {
    this.enterDisplayMode(); // do this first!

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

  updateAppDisplay(newAppMode) {
    // idempotence is VERY important here
    if (newAppMode == this.appMode) {
      return;
    }

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

      if (typeof TogetherJS === 'undefined' || !TogetherJS.running) {
        $("#surveyHeader").show();
      }

      this.doneExecutingCode();

      // do this AFTER making #pyOutputPane visible, or else
      // jsPlumb connectors won't render properly
      this.myVisualizer.updateOutput();

      // customize edit button click functionality AFTER rendering (NB: awkward!)
      $('#pyOutputPane #editCodeLinkDiv').show();
      $('#pyOutputPane #editBtn').click(() => {
        this.enterEditMode();
      });
      var v = $('#pythonVersionSelector').val();
      if (v === 'js' || v === '2' || v === '3') {
        var myArgs = this.getAppState();
        var urlStr = $.param.fragment('live.html', myArgs, 2 /* clobber all */);
        $("#pyOutputPane #liveModeSpan").show();
        $('#pyOutputPane #editLiveModeBtn').click(() => {
          var myArgs = this.getAppState();
          var urlStr = $.param.fragment('live.html', myArgs, 2 /* clobber all */);
          window.open(urlStr); // open in new tab
          return false; // to prevent default "a href" click action
        });
      } else {
        $("#pyOutputPane #liveModeSpan").hide();
      }

      $(document).scrollTop(0); // scroll to top to make UX better on small monitors

      // NASTY global for shared sessions
      if (pendingCodeOutputScrollTop) {
        this.myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(pendingCodeOutputScrollTop);
        pendingCodeOutputScrollTop = null;
      }

      $.doTimeout('pyCodeOutputDivScroll'); // cancel any prior scheduled calls

      // TODO: this might interfere with experimentalPopUpSyntaxErrorSurvey (2015-04-19)
      this.myVisualizer.domRoot.find('#pyCodeOutputDiv').scroll(function(e) {
        var elt = $(this);
        // debounce
        $.doTimeout('pyCodeOutputDivScroll', 100, function() {
          // note that this will send a signal back and forth both ways
          if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
            // (there's no easy way to prevent this), but it shouldn't keep
            // bouncing back and forth indefinitely since no the second signal
            // causes no additional scrolling
            TogetherJS.send({type: "pyCodeOutputDivScroll",
                             scrollTop: elt.scrollTop()});
          }
        });
      });

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
    logEventCodeopticon({type: 'updateAppDisplay', mode: this.appMode, appState: this.getAppState()});
  }

  handleUncaughtExceptionFunc(trace) {
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

  executeCodeAndCreateViz(codeToExec,
                          pyState,
                          backendOptionsObj, frontendOptionsObj,
                          outputDiv) {
      var backendScript = langSettingToBackendScript[pyState];
      assert(backendScript);
      var jsonp_endpoint = langSettingToJsonpEndpoint[pyState]; // maybe null

      function execCallback(dataFromBackend) {
        var trace = dataFromBackend.trace;
        var killerException = null;
        // don't enter visualize mode if there are killer errors:
        if (!trace ||
            (trace.length == 0) ||
            (trace[trace.length - 1].event == 'uncaught_exception')) {

          this.handleUncaughtExceptionFunc(trace);

          if (trace.length == 1) {
            killerException = trace[0]; // killer!
            this.setFronendError([trace[0].exception_msg]);
          }
          else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
            killerException = trace[trace.length - 1]; // killer!
            this.setFronendError([trace[trace.length - 1].exception_msg]);
          }
          else {
            this.setFronendError(
                            ["Unknown error. Reload the page and try again. Or report a bug to",
                             "philip@pgbovine.net by clicking on the 'Generate permanent link'",
                             "button at the bottom and including a URL in your email."]);
          }
        } else {
          // fail-soft to prevent running off of the end of trace
          if (frontendOptionsObj.startingInstruction >= trace.length) {
            frontendOptionsObj.startingInstruction = 0;
          }

          if (frontendOptionsObj.runTestCaseCallback) {
            // hacky! DO NOT actually create a visualization! instead call:
            frontendOptionsObj.runTestCaseCallback(trace);
          } else {
            // success!
            this.myVisualizer = new pytutor.ExecutionVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);

            this.myVisualizer.add_pytutor_hook("end_updateOutput", function(args) {
              if (updateOutputSignalFromRemote) {
                return;
              }
              if (typeof TogetherJS !== 'undefined' && TogetherJS.running && !this.isExecutingCode) {
                TogetherJS.send({type: "updateOutput", step: args.myViz.curInstr});
              }

              // debounce to compress a bit ... 250ms feels "right"
              $.doTimeout('updateOutputLogEvent', 250, function() {
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
                logEventCodeopticon(obj);
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
          // SUPER HACK -- slip in backendOptionsObj as an extra field
          if (this.myVisualizer) {
            this.myVisualizer.backendOptionsObj = backendOptionsObj;
          }

          this.optFinishSuccessfulExecution();

          // VERY SUBTLE -- reinitialize TogetherJS so that it can detect
          // and sync any new elements that are now inside myVisualizer
          if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
            TogetherJS.reinitialize();
          }
        }

        this.doneExecutingCode(); // rain or shine, we're done executing!
        // run this at the VERY END after all the dust has settled

        // do logging at the VERY END after the dust settles ...
        // and don't do it for iframe-embed.js since getAppState doesn't
        // work in that case ...
        if (this.originFrontendJsFile !== 'iframe-embed.js') {
          logEventCodeopticon({type: 'doneExecutingCode',
                    appState: this.getAppState(),
                    // enough to reconstruct the ExecutionVisualizer object
                    backendDataJSON: JSON.stringify(dataFromBackend), // for easier transport and compression
                    frontendOptionsObj: frontendOptionsObj,
                    backendOptionsObj: backendOptionsObj,
                    killerException: killerException, // if there's, say, a syntax error
                    });
        }

        // tricky hacky reset
        this.num414Tries = 0;
      }

      if (!backendScript) {
        this.setFronendError(
                        ["Server configuration error: No backend script",
                         "Report a bug to philip@pgbovine.net by clicking on the 'Generate permanent link'",
                         "button at the bottom and including a URL in your email."]);
        return;
      }

      if (typeof TogetherJS !== 'undefined' &&
          TogetherJS.running && !executeCodeSignalFromRemote) {
        TogetherJS.send({type: "executeCode",
                         myAppState: this.getAppState(),
                         forceStartingInstr: frontendOptionsObj.startingInstruction,
                         rawInputLst: this.rawInputLst});
      }

      this.snapshotCodeDiff(); // do ONE MORE snapshot before we execute, or else
                               // we'll miss a diff if the user hits Visualize Execution
                               // very shortly after finishing coding
      if (this.deltaObj) {
        this.deltaObj.executeTime = new Date().getTime();
      }

      // if you're in display mode, kick back into edit mode before
      // executing or else the display might not refresh properly ... ugh
      // krufty FIXME
      this.enterEditMode();

      this.clearFrontendError();
      this.startExecutingCode();

      frontendOptionsObj.lang = pyState;
      // kludgy exceptions
      if (pyState === '2') {
        frontendOptionsObj.lang = 'py2';
      } else if (pyState === '3') {
        frontendOptionsObj.lang = 'py3';
      } else if (pyState === 'java') {
        frontendOptionsObj.disableHeapNesting = true; // never nest Java objects, seems like a good default
      }

      // if we don't have any deltas, then don't bother sending deltaObj:
      var deltaObjStringified = (this.deltaObj && (this.deltaObj.deltas.length > 0)) ? JSON.stringify(this.deltaObj) : null;
      if (deltaObjStringified) {
        // if deltaObjStringified is too long, then that will likely make
        // the URL way too long. in that case, just make it null and don't
        // send a delta. we'll lose some info but at least the URL will
        // hopefully not overflow:
        if (deltaObjStringified.length > 4096) {
          //console.log('deltaObjStringified.length:', deltaObjStringified.length, '| too long, so set to null');
          deltaObjStringified = null;
        } else {
          //console.log('deltaObjStringified.length:', deltaObjStringified.length);
        }
      } else {
        //console.log('deltaObjStringified is null');
      }

      if (jsonp_endpoint) {
        assert (pyState !== '2' && pyState !== '3');
        // hack! should just be a dummy script for logging only
        $.get(backendScript,
              {user_script : codeToExec,
               options_json: JSON.stringify(backendOptionsObj),
               user_uuid: supports_html5_storage() ? localStorage.getItem('opt_uuid') : undefined,
               session_uuid: this.sessionUUID,
               diffs_json: deltaObjStringified},
               function(dat) {} /* don't do anything since this is a dummy call */, "text");

        // the REAL call uses JSONP
        // http://learn.jquery.com/ajax/working-with-jsonp/
        $.ajax({
          url: jsonp_endpoint,
          // The name of the callback parameter, as specified by the YQL service
          jsonp: "callback",
          dataType: "jsonp",
          data: {user_script : codeToExec,
                 options_json: JSON.stringify(backendOptionsObj)},
          success: execCallback.bind(this) /* tricky! */,
        });
      } else {
        // Python 2 or 3
        assert (pyState === '2' || pyState === '3');
        $.get(backendScript,
              {user_script : codeToExec,
               raw_input_json: this.rawInputLst.length > 0 ? JSON.stringify(this.rawInputLst) : '',
               options_json: JSON.stringify(backendOptionsObj),
               user_uuid: supports_html5_storage() ? localStorage.getItem('opt_uuid') : undefined,
               session_uuid: this.sessionUUID,
               diffs_json: deltaObjStringified},
               execCallback.bind(this) /* tricky! */, "json");
      }

      this.initDeltaObj(); // clear deltaObj to start counting over again
  }

  // sets globals such as rawInputLst, code input box, and toggle options
  parseQueryString() {
    var queryStrOptions = this.getQueryStringOptions();
    this.setToggleOptions(queryStrOptions);
    if (queryStrOptions.preseededCode) {
      this.pyInputSetValue(queryStrOptions.preseededCode);
    }
    if (queryStrOptions.rawInputLst) {
      this.rawInputLst = queryStrOptions.rawInputLst; // global
    }
    else {
      this.rawInputLst = [];
    }

    if (queryStrOptions.codeopticonSession) {
      assert(false); // TODO: this won't currently work with Webpack, so fix it later
      codeopticonSession = queryStrOptions.codeopticonSession; // GLOBAL defined in codeopticon-learner.js
      codeopticonUsername = queryStrOptions.codeopticonUsername; // GLOBAL defined in codeopticon-learner.js
    }

    if (queryStrOptions.testCasesLst && this.loadTestCases) {
      this.loadTestCases(queryStrOptions.testCasesLst);
    }

    // ugh tricky -- always start in edit mode by default, and then
    // switch to display mode only after the code successfully executes
    this.appMode = 'edit';
    if ((queryStrOptions.appMode == 'display' ||
         queryStrOptions.appMode == 'visualize' /* 'visualize' is deprecated */) &&
        queryStrOptions.preseededCode /* jump to display only with pre-seeded code */) {
      this.executeCode(queryStrOptions.preseededCurInstr); // will switch to 'display' mode
    }
    $.bbq.removeState(); // clean up the URL no matter what
  }

  // parsing the URL query string hash
  getQueryStringOptions() {
    var ril = $.bbq.getState('rawInputLstJSON');
    var testCasesLstJSON = $.bbq.getState('testCasesJSON');
    // note that any of these can be 'undefined'
    return {preseededCode: $.bbq.getState('code'),
            preseededCurInstr: Number($.bbq.getState('curInstr')),
            verticalStack: $.bbq.getState('verticalStack'),
            appMode: $.bbq.getState('mode'),
            py: $.bbq.getState('py'),
            cumulative: $.bbq.getState('cumulative'),
            heapPrimitives: $.bbq.getState('heapPrimitives'),
            textReferences: $.bbq.getState('textReferences'),
            rawInputLst: ril ? $.parseJSON(ril) : undefined,
            codeopticonSession: $.bbq.getState('cosession'),
            codeopticonUsername: $.bbq.getState('couser'),
            testCasesLst: testCasesLstJSON ? $.parseJSON(testCasesLstJSON) : undefined
            };
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
      $.get('viz_interaction.py', myArgs, function(dat) {});
    }
  }

  setSurveyHTML() {
    $('#surveyPane').html(survey_v8);
  }
} // END class AbstractBaseFrontend


/* For survey questions. Versions of survey wording:

[see ../../v3/js/opt-frontend-common.js for older versions of survey wording - v1 to v7]

v8: (deployed on 2016-06-20) - like v7 except emphasize the main usage survey more, and have the over-60 survey as auxiliary
*/
const survey_v8 = '\n\
<p style="font-size: 10pt; margin-top: 10px; margin-bottom: 15px; line-height: 175%;">\n\
<span>Support our research and keep this tool free by <a href="https://docs.google.com/forms/d/1-aKilu0PECHZVRSIXHv8vJpEuKUO9uG3MrH864uX56U/viewform" target="_blank">filling out this user survey</a>.</span>\n\
<br/>\n\
<span style="font-size: 9pt;">If you are <b>at least 60 years old</b>, please also fill out <a href="https://docs.google.com/forms/d/1lrXsE04ghfX9wNzTVwm1Wc6gQ5I-B4uw91ACrbDhJs8/viewform" target="_blank">our survey about learning programming</a>.</span>\n\
</p>'

// empty stub so that our code doesn't crash.
// override this with a version in codeopticon-learner.js if needed
function logEventCodeopticon(obj) {}


// misc utilities:

// From http://stackoverflow.com/a/8809472
function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
};

// From http://diveintohtml5.info/storage.html
export function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}
