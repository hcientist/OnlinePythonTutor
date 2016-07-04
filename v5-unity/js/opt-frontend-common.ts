// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

/* TODO

- put shared session stuff into a separate codechella module, maybe?

- encapsulate all of the global variables into a frontend state object
  that can be exported wholesale to other modules

  - look for initializeFrontendParams as a potential abstraction point
  - e.g., getAppState and appStateEq, etc., can be in an AppState class

- figure out how to avoid unnecessary duplication with opt-live.js

*/

require('./lib/diff_match_patch.js');
require('./lib/jquery.ba-dotimeout.min.js');

var pytutor = require('./pytutor.ts');
var assert = pytutor.assert;

// for TypeScript
declare var TogetherJS: any;
declare var TogetherJSConfig_ignoreForms: any;
declare var diff_match_patch: any;
declare var codeopticonUsername: string; // FIX later when porting Codeopticon
declare var codeopticonSession: string;  // FIX later when porting Codeopticon

// augment existing interface definitions from typings/
interface JQuery {
  // attr can also take a boolean as a second argument
  attr(attributeName: string, b: boolean): JQuery;
}

interface JQueryStatic {
  doTimeout: any;
}

declare namespace AceAjax {
  interface IEditSession {
    setFoldStyle: any;
    setOption: any;
    gutterRenderer: any;
  }

  interface Editor {
    setHighlightGutterLine: any;
    setDisplayIndentGuides: any;
    on: any;
  }
}


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


// TODO: encapsulate tons of globals into a class of some sort:

var myVisualizer = null; // singleton ExecutionVisualizer instance
function getVisualizer() {return myVisualizer;}
function setVisualizer(v) {myVisualizer = v;}

var rawInputLst = []; // a list of strings inputted by the user in response to raw_input or mouse_input events
function getRawInputLst() {return rawInputLst;}
function setRawInputLst(lst) {rawInputLst = lst;}

var isExecutingCode = false; // nasty, nasty global

var appMode = 'edit'; // 'edit' or 'display'. also support
                      // 'visualize' for backward compatibility (same as 'display')
function getAppMode() {
  return appMode;
}

var sessionUUID = generateUUID(); // remains constant throughout one page load ("session")
function getSessionUUID() {return sessionUUID;}

var originFrontendJsFile: string = undefined;

var appStateAugmenter: any = undefined; // super hacky! fixme
var loadTestCases: any = undefined; // super hacky! fixme

var pyInputAceEditor; // Ace editor object that contains the input code
function getAceEditor() {return pyInputAceEditor;}
function setAceEditor(e) {pyInputAceEditor = e;}

var dmp = new diff_match_patch();
var curCode = '';
var deltaObj : {start: string, deltas: any[], v: number, startTime: number, executeTime?: number} = undefined;

var num414Tries = 0; // SUPER hacky global, ergh

// each frontend must implement its own executeCode function
var executeCode = undefined;


// these settings are all customized for my own server setup,
// so you will need to customize for your server:
var serverRoot = (window.location.protocol === 'https:') ?
                  'https://cokapi.com:8001/' : // my certificate for https is registered via cokapi.com, so use it for now
                  'http://104.237.139.253:3000/';

var JS_JSONP_ENDPOINT = serverRoot + 'exec_js_jsonp'; // TODO: get rid of this dependency in opt-live.ts

// note that we use '2' and '3' instead of 'py2' and 'py3' due to legacy reasons
var langSettingToBackendScript = {
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
var langSettingToJsonpEndpoint = {
  '2':    null,
  '3':    null,
  'js':   serverRoot + 'exec_js_jsonp',
  'ts':   serverRoot + 'exec_ts_jsonp',
  'java': serverRoot + 'exec_java_jsonp',
  'ruby': serverRoot + 'exec_ruby_jsonp',
  'c':    serverRoot + 'exec_c_jsonp',
  'cpp':  serverRoot + 'exec_cpp_jsonp',
};


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
function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}


function initDeltaObj() {
  // make sure the editor already exists
  // (editor doesn't exist when you're, say, doing an iframe embed)
  if (!pyInputAceEditor) {
    return;
  }

  // v is the version number
  //   1 (version 1 was released on 2014-11-05)
  //   2 (version 2 was released on 2015-09-16, added a startTime field)
  deltaObj = {start: pyInputGetValue(), deltas: [], v: 2,
              startTime: new Date().getTime()};
}

var initAceEditor = function(height) {
  pyInputAceEditor = ace.edit('codeInputPane');
  var s = pyInputAceEditor.getSession();
  // tab -> 4 spaces
  s.setTabSize(4);
  s.setUseSoftTabs(true);
  // disable extraneous indicators:
  s.setFoldStyle('manual'); // no code folding indicators
  s.getDocument().setNewLineMode('unix'); // canonicalize all newlines to unix format
  pyInputAceEditor.setHighlightActiveLine(false);
  pyInputAceEditor.setShowPrintMargin(false);
  pyInputAceEditor.setBehavioursEnabled(false);
  pyInputAceEditor.$blockScrolling = Infinity; // kludgy to shut up weird warnings

  // auto-grow height as fit
  pyInputAceEditor.setOptions({minLines: 18, maxLines: 1000});

  $('#codeInputPane').css('width', '700px');
  $('#codeInputPane').css('height', height + 'px'); // VERY IMPORTANT so that it works on I.E., ugh!

  initDeltaObj();
  pyInputAceEditor.on('change', function(e) {
    $.doTimeout('pyInputAceEditorChange', CODE_SNAPSHOT_DEBOUNCE_MS, snapshotCodeDiff); // debounce
    clearFrontendError();
    s.clearAnnotations();
  });

  // don't do real-time syntax checks:
  // https://github.com/ajaxorg/ace/wiki/Syntax-validation
  s.setOption("useWorker", false);

  setAceMode();
  pyInputAceEditor.focus();
}

function setAceMode() {
  var selectorVal = $('#pythonVersionSelector').val();
  var mod;
  var tabSize = 2;
  var editorVal = $.trim(pyInputGetValue());

  if (editorVal === JAVA_BLANK_TEMPLATE || editorVal === CPP_BLANK_TEMPLATE) {
    editorVal = '';
    pyInputSetValue(editorVal);
  }

  if (selectorVal === 'java') {
    mod = 'java';
    if (editorVal === '') {
      pyInputSetValue(JAVA_BLANK_TEMPLATE);
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
      pyInputSetValue(CPP_BLANK_TEMPLATE);
    }
  } else {
    assert(selectorVal === '2' || selectorVal == '3')
    mod = 'python';
    tabSize = 4; // PEP8 style standards
  }
  assert(mod);

  var s = pyInputAceEditor.getSession();
  s.setMode("ace/mode/" + mod);
  s.setTabSize(tabSize);
  s.setUseSoftTabs(true);

  // clear all error displays when switching modes
  var s = pyInputAceEditor.getSession();
  s.clearAnnotations();
  clearFrontendError();
}

function snapshotCodeDiff() {
  if (!deltaObj) {
    return;
  }

  var newCode = pyInputGetValue();
  var timestamp = new Date().getTime();

  //console.log('Orig:', curCode);
  //console.log('New:', newCode);
  if (curCode != newCode) {
    var diff = dmp.diff_toDelta(dmp.diff_main(curCode, newCode));
    //var patch = dmp.patch_toText(dmp.patch_make(curCode, newCode));
    var delta = {t: timestamp, d: diff};
    deltaObj.deltas.push(delta);

    curCode = newCode;
    logEventCodeopticon({type: 'editCode', delta: delta});

    if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
      TogetherJS.send({type: "editCode", delta: delta});
    }
  }
}

// for reference only
/*
function reconstructCode() {
  var cur = '';

  var dmp = new diff_match_patch();
  var deltas = [];
  var patches = [];

  var prevTimestamp = undefined;
  $.each(deltaObj.deltas, function(i, e) {
    if (prevTimestamp) {
      assert(e.t >= prevTimestamp);
      prevTimestamp = e.t;
    }
    deltas.push(e.d);
    patches.push(e.p);
  });

  console.log(patches);
  console.log(deltas);

  //var d = dmp.diff_fromDelta('', "+x = 1")
  //var p = dmp.patch_make(d)
  //dmp.patch_apply(p, '')

  //x = dmp.patch_fromText("@@ -0,0 +1,5 @@\n+x = 1\n")
  //dmp.patch_apply(x, '')
  //x = dmp.patch_fromText("@@ -1,5 +1,12 @@\n x = 1\n+%0Ax = 2%0A\n")
  //dmp.patch_apply(x, 'x = 1')
}
*/


// BEGIN - shared session stuff

// grab this as early as possible before TogetherJS munges the URL
var togetherjsInUrl = ($.bbq.getState('togetherjs') !== undefined);

// XXX: to deploy, substitute in the online TogetherJS server URL here
var TogetherJSConfig_hubBase = "http://localhost:30035/"; // local

// TogetherJS common configuration
// TODO: xxx these aren't 'exported' so they're no longer visible to TogetherJS
// ... thus, these will NOT SET TogetherJS configuration options. ergh!!!
var TogetherJSConfig_disableWebRTC = true;
var TogetherJSConfig_suppressJoinConfirmation = true;
var TogetherJSConfig_dontShowClicks = false;

// stop popping up boring intro dialog box:
var TogetherJSConfig_seenIntroDialog = true;

// suppress annoying pop-ups:
var TogetherJSConfig_suppressInvite = true;
var TogetherJSConfig_suppressJoinConfirmation = true;

// clone clicks ONLY in certain elements to keep things simple:
var TogetherJSConfig_cloneClicks = '#pyInputPane select';

var TogetherJSConfig_siteName = "Online Python Tutor shared session";
var TogetherJSConfig_toolName = "Online Python Tutor shared session";

// more nasty global state vars
var updateOutputSignalFromRemote = false;
var executeCodeSignalFromRemote = false;
var togetherjsSyncRequested = false;
var pendingCodeOutputScrollTop = null;

TogetherJSConfig_ignoreForms = ['.togetherjsIgnore']; // do NOT sync these elements


function requestSync() {
  if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
    togetherjsSyncRequested = true;
    TogetherJS.send({type: "requestSync"});
  }
}

function syncAppState(appState) {
  setToggleOptions(appState);

  // VERY VERY subtle -- temporarily prevent TogetherJS from sending
  // form update events while we set the input value. otherwise
  // this will send an incorrect delta to the other end and screw things
  // up because the initial states of the two forms aren't equal.
  var orig = TogetherJS.config.get('ignoreForms');
  TogetherJS.config('ignoreForms', true);
  pyInputSetValue(appState.code);
  TogetherJS.config('ignoreForms', orig);

  if (appState.rawInputLst) {
    rawInputLst = $.parseJSON(appState.rawInputLstJSON);
  }
  else {
    rawInputLst = [];
  }
}

// get OPT ready for integration with TogetherJS
function initTogetherJS() {
  if (typeof TogetherJS === "undefined") {
    return;
  }

  if (togetherjsInUrl) {
    $("#ssDiv").hide(); // hide ASAP!
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
  TogetherJS.hub.on("togetherjs.hello-back", function(msg) {
    // do NOT use a msg.sameUrl guard since that will miss some signals
    // due to our funky URLs

    var p = TogetherJS.require("peers");

    var peerNames = p.getAllPeers().map(function(e) {return e.name});

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

  TogetherJS.hub.on("updateOutput", function(msg) {
    // do NOT use a msg.sameUrl guard since that will miss some signals
    // due to our funky URLs

    if (isExecutingCode) {
      return;
    }

    if (myVisualizer) {
      // to prevent this call to updateOutput from firing its own TogetherJS event
      updateOutputSignalFromRemote = true;
      try {
        myVisualizer.renderStep(msg.step);
      }
      finally {
        updateOutputSignalFromRemote = false;
      }
    }
  });

  TogetherJS.hub.on("executeCode", function(msg) {
    // do NOT use a msg.sameUrl guard since that will miss some signals
    // due to our funky URLs

    if (isExecutingCode) {
      return;
    }

    executeCodeSignalFromRemote = true;
    try {
      executeCode(msg.forceStartingInstr, msg.rawInputLst);
    }
    finally {
      executeCodeSignalFromRemote = false;
    }

  });

  TogetherJS.hub.on("hashchange", function(msg) {
    // do NOT use a msg.sameUrl guard since that will miss some signals
    // due to our funky URLs

    if (isExecutingCode) {
      return;
    }

    console.log("TogetherJS RECEIVE hashchange", msg.appMode);
    if (msg.appMode != appMode) {
      updateAppDisplay(msg.appMode);

      if (appMode == 'edit' && msg.codeInputScrollTop !== undefined &&
          pyInputGetScrollTop() != msg.codeInputScrollTop) {
        // hack: give it a bit of time to settle first ...
        $.doTimeout('pyInputCodeMirrorInit', 200, function() {
          pyInputSetScrollTop(msg.codeInputScrollTop);
        });
      }
    }
  });

  TogetherJS.hub.on("codemirror-edit", function(msg) {
    // do NOT use a msg.sameUrl guard since that will miss some signals
    // due to our funky URLs
    $("#codeInputWarnings").hide();
    $("#someoneIsTypingDiv").show();

    $.doTimeout('codeMirrorWarningTimeout', 1000, function() { // debounce
      $("#codeInputWarnings").show();
      $("#someoneIsTypingDiv").hide();
    });
  });

  TogetherJS.hub.on("requestSync", function(msg) {
    // do NOT use a msg.sameUrl guard since that will miss some signals
    // due to our funky URLs

    if (TogetherJS.running) {
      TogetherJS.send({type: "myAppState",
                       myAppState: getAppState(),
                       codeInputScrollTop: pyInputGetScrollTop(),
                       pyCodeOutputDivScrollTop: myVisualizer ?
                                                 myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop() :
                                                 undefined});
    }
  });

  TogetherJS.hub.on("myAppState", function(msg) {
    // do NOT use a msg.sameUrl guard since that will miss some signals
    // due to our funky URLs

    // if we didn't explicitly request a sync, then don't do anything
    if (!togetherjsSyncRequested) {
      return;
    }

    togetherjsSyncRequested = false;

    var learnerAppState = msg.myAppState;

    if (learnerAppState.mode == 'display') {
      if (appStateEq(getAppState(), learnerAppState)) {
        // update curInstr only
        console.log("on:myAppState - app states equal, renderStep", learnerAppState.curInstr);
        myVisualizer.renderStep(learnerAppState.curInstr);

        if (msg.pyCodeOutputDivScrollTop !== undefined) {
          myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(msg.pyCodeOutputDivScrollTop);
        }
      }
      else if (!isExecutingCode) { // if already executing from a prior signal, ignore
        console.log("on:myAppState - app states unequal, executing", learnerAppState);
        syncAppState(learnerAppState);

        executeCodeSignalFromRemote = true;
        try {
          if (msg.pyCodeOutputDivScrollTop !== undefined) {
            pendingCodeOutputScrollTop = msg.pyCodeOutputDivScrollTop; // NASTY global
          }
          executeCode(learnerAppState.curInstr);
        }
        finally {
          executeCodeSignalFromRemote = false;
        }
      }
    }
    else {
      assert(learnerAppState.mode == 'edit');
      if (!appStateEq(getAppState(), learnerAppState)) {
        console.log("on:myAppState - edit mode sync");
        syncAppState(learnerAppState);
        enterEditMode();
      }
    }

    if (msg.codeInputScrollTop !== undefined) {
      // give pyInputAceEditor a bit of time to settle with
      // its new value. this is hacky; ideally we have a callback function for
      // when setValue() completes.
      $.doTimeout('pyInputCodeMirrorInit', 200, function() {
        pyInputSetScrollTop(msg.codeInputScrollTop);
      });
    }
  });

  TogetherJS.hub.on("syncAppState", function(msg) {
    syncAppState(msg.myAppState);
  });

  TogetherJS.hub.on("codeInputScroll", function(msg) {
    // do NOT use a msg.sameUrl guard since that will miss some signals
    // due to our funky URLs

    // don't sync for Ace since I can't get it working properly yet
  });

  TogetherJS.hub.on("pyCodeOutputDivScroll", function(msg) {
    // do NOT use a msg.sameUrl guard since that will miss some signals
    // due to our funky URLs

    if (myVisualizer) {
      myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(msg.scrollTop);
    }
  });

  $("#sharedSessionBtn").click(startSharedSession);
  $("#stopTogetherJSBtn").click(TogetherJS); // toggles off

  // fired when TogetherJS is activated. might fire on page load if there's
  // already an open session from a prior page load in the recent past.
  TogetherJS.on("ready", function () {
    console.log("TogetherJS ready");

    $("#sharedSessionDisplayDiv").show();
    $("#adInfo").hide();
    $("#ssDiv").hide();
    $("#adHeader").hide();

    // send this to the server for the purposes of logging, but other
    // clients shouldn't do anything with this data
    if (TogetherJS.running) {
      TogetherJS.send({type: "initialAppState",
                       myAppState: getAppState(),
                       user_uuid: supports_html5_storage() ? localStorage.getItem('opt_uuid') : undefined,
                       // so that you can tell whether someone else
                       // shared a TogetherJS URL with you to invite you
                       // into this shared session:
                       togetherjsInUrl: togetherjsInUrl});
    }

    requestSync(); // immediately try to sync upon startup so that if
                   // others are already in the session, we will be
                   // synced up. and if nobody is here, then this is a NOP.

    TogetherjsReadyHandler(); // needs to be defined in each frontend
    redrawConnectors(); // update all arrows at the end
  });

  // emitted when TogetherJS is closed. This is not emitted when the
  // webpage simply closes or navigates elsewhere, ONLY when TogetherJS
  // is explicitly stopped via a call to TogetherJS()
  TogetherJS.on("close", function () {
    console.log("TogetherJS close");

    $("#togetherjsStatus").html(''); // clear it
    $("#sharedSessionDisplayDiv").hide();
    $("#adInfo").show();
    $("#ssDiv").show();
    $("#adHeader").show();

    TogetherjsCloseHandler(); // needs to be defined in each frontend
    redrawConnectors(); // update all arrows at the end
  });
}

var TogetherjsReadyHandler = undefined; // need to override in frontend
var TogetherjsCloseHandler = undefined; // need to override in frontend

var startSharedSession = function() {
  $("#ssDiv").hide(); // hide ASAP!
  $("#togetherjsStatus").html("Please wait ... loading shared session");
  TogetherJS();
}

function populateTogetherJsShareUrl() {
  // without anything after the '#' in the hash
  var cleanUrl = $.param.fragment(location.href, {}, 2 /* override */);

  var shareId = TogetherJS.shareId();
  assert(shareId, "Attempted to access shareId before it is set");

  var urlToShare = cleanUrl + 'togetherjs=' + shareId;
  $("#togetherjsStatus").html('<div>\
                               Send the URL below to invite someone to join this shared session:\
                               </div>\
                               <input type="text" style="font-size: 10pt; \
                               font-weight: bold; padding: 4px;\
                               margin-top: 3pt; \
                               margin-bottom: 6pt;" \
                               id="togetherjsURL" size="80" readonly="readonly"/>\
                               <button id="syncBtn" type="button">Force sync</button>\
                               ');
  $("#togetherjsURL").val(urlToShare).attr('size', urlToShare.length + 20);
  $("#syncBtn").click(requestSync);

  // deployed on 2015-03-06, simplified request on 2016-05-30
  var emailNotificationHtml = '<div style="margin-top: 3px; margin-bottom: 10px; font-size: 8pt; width: 350px;"><a href="https://docs.google.com/forms/d/126ZijTGux_peoDusn1F9C1prkR226897DQ0MTTB5Q4M/viewform" target="_blank">Report bugs and feedback</a> on this shared sessions feature.</div>'
  $("#togetherjsStatus").append(emailNotificationHtml);
}

// END - shared session stuff


function redrawConnectors() {
  if (appMode == 'display' ||
      appMode == 'visualize' /* deprecated */) {
    if (myVisualizer) {
      myVisualizer.redrawConnectors();
    }
  }
}

function setFronendError(lines) {
  $("#frontendErrorOutput").html(lines.map(pytutor.htmlspecialchars).join('<br/>'));
}

function clearFrontendError() {
  $("#frontendErrorOutput").html('');
}

function pyInputGetValue() {
  return pyInputAceEditor.getValue();
}

function pyInputSetValue(dat) {
  pyInputAceEditor.setValue(dat.rtrim() /* kill trailing spaces */,
                            -1 /* do NOT select after setting text */);
  $('#urlOutput,#embedCodeOutput').val('');

  clearFrontendError();

  // also scroll to top to make the UI more usable on smaller monitors
  $(document).scrollTop(0);
}


function pyInputGetScrollTop() {
  return pyInputAceEditor.getSession().getScrollTop();
}

function pyInputSetScrollTop(st) {
  pyInputAceEditor.getSession().setScrollTop(st);
}


// TODO: fixme, this is all very hacky and inelegant
// this is a good candidate for a constructor, and these fields are ones
// that can be overriden or something :)
function initializeFrontendParams(params) {
  originFrontendJsFile = params.originFrontendJsFile; // nasty global
  executeCode = params.executeCode; // nasty global
  assert(originFrontendJsFile);
  assert(executeCode);

  // optional
  if (params.TogetherjsReadyHandler) {
    TogetherjsReadyHandler = params.TogetherjsReadyHandler;
  }
  if (params.TogetherjsCloseHandler) {
    TogetherjsCloseHandler = params.TogetherjsCloseHandler;
  }
  if (params.startSharedSession) {
    startSharedSession = params.startSharedSession;
  }
  if (params.initAceEditor) {
    initAceEditor = params.initAceEditor;
  }
  if (params.appStateAugmenter) {
    appStateAugmenter = params.appStateAugmenter;
  }
  if (params.loadTestCases) {
    loadTestCases = params.loadTestCases;
  }
}

// run at the END so that everything else can be initialized first
function genericOptFrontendReady(params) {
  assert(params);
  initializeFrontendParams(params);
  initTogetherJS(); // initialize early but after initializeFrontendParams

  $(window).bind("hashchange", function(e) {
    // if you've got some preseeded code, then parse the entire query
    // string from scratch just like a page reload
    if ($.bbq.getState('code')) {
      parseQueryString();
    }
    // otherwise just do an incremental update
    else {
      var newMode = $.bbq.getState('mode');
      //console.log('hashchange:', newMode, window.location.hash);
      updateAppDisplay(newMode);
    }

    if (typeof TogetherJS !== 'undefined' && TogetherJS.running && !isExecutingCode) {
      TogetherJS.send({type: "hashchange",
                       appMode: appMode,
                       codeInputScrollTop: pyInputGetScrollTop(),
                       myAppState: getAppState()});
    }
  });


  initAceEditor(420);
  pyInputAceEditor.getSession().on("change", function(e) {
    // unfortunately, Ace doesn't detect whether a change was caused
    // by a setValue call
    if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
      TogetherJS.send({type: "codemirror-edit"});
    }
  });

  // don't sync for Ace since I can't get it working properly yet
  /*
  pyInputAceEditor.getSession().on('changeScrollTop', function() {
    if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
      $.doTimeout('codeInputScroll', 100, function() { // debounce
        // note that this will send a signal back and forth both ways
        // (there's no easy way to prevent this), but it shouldn't keep
        // bouncing back and forth indefinitely since no the second signal
        // causes no additional scrolling
        TogetherJS.send({type: "codeInputScroll",
                         scrollTop: pyInputGetScrollTop()});
      });
    }
  });
  */


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
          (Storage as any /* TS too strict */).prototype._setItem = Storage.prototype.setItem;
          Storage.prototype.setItem = function() {};
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
    setToggleOptions(lsOptions);

    // store in localStorage whenever user explicitly changes any toggle option:
    $('#cumulativeModeSelector,#heapPrimitivesSelector,#textualMemoryLabelsSelector,#pythonVersionSelector').change(function() {
      var ts = getToggleState();
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

  parseQueryString();

  $(window).resize(redrawConnectors);

  $('#genUrlBtn').bind('click', function() {
    var myArgs = getAppState();
    var urlStr = $.param.fragment(window.location.href, myArgs, 2 /* clobber all */);
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

    /* On my server ...

      This jqxhr.responseText might be indicative of the URL being too
      long, since the error message returned by the server is something
      like this in nginx:

<html>
<head><title>414 Request-URI Too Large</title></head>
<body bgcolor="white">
<center><h1>414 Request-URI Too Large</h1></center>
<hr><center>nginx</center>
</body>
</html>

      Note that you'll probably need to customize this check for your server. */
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
      if (num414Tries === 0) {
        num414Tries++;
        startExecutingCode(); // TODO: does this work?
        $("#executeBtn").click();
      } else {
        num414Tries = 0;
        setFronendError(["Server error! Your code might be too long for this tool. Shorten your code and re-try."]);
      }
    } else {
      setFronendError(["Server error! Your code might be taking too much time to run or using too much memory.",
                       "Report a bug to philip@pgbovine.net by clicking the 'Generate permanent link' button",
                       "at the bottom of this page and including a URL in your email."]);
    }
    doneExecutingCode();
  });

  clearFrontendError();

  $("#embedLinkDiv").hide();
  $("#executeBtn").attr('disabled', false);
  $("#executeBtn").click(executeCodeFromScratch);

  // when you leave or reload the page, submit an updateHistoryJSON if you
  // have one. beforeunload seems to work better than unload(), but it's
  // still a bit flaky ... TODO: investigate :(
  $(window).on('beforeunload', function(){
    submitUpdateHistory('beforeunload');
    // don't return anything, or a modal dialog box might pop up
  });

  // just do this as well, even though it might be hella redundant
  $(window).on('unload', function(){
    submitUpdateHistory('unload');
    // don't return anything, or a modal dialog box might pop up
  });

  // periodically do submitUpdateHistory() to handle the case when
  // someone is simply idle on the page without reloading it or
  // re-editing code; that way, we can still get some signals rather
  // than nothing.
  var lastSubmittedUpdateHistoryLength = 0;
  setInterval(function() {
    if (myVisualizer) {
      var uh = myVisualizer.updateHistory;
      // don't submit identical entries repeatedly since that's redundant
      if (uh && (uh.length != lastSubmittedUpdateHistoryLength)) {
        lastSubmittedUpdateHistoryLength = uh.length;
        submitUpdateHistory('periodic');
      }
    }
  }, SUBMIT_UPDATE_HISTORY_INTERVAL_MS);
}

// sets globals such as rawInputLst, code input box, and toggle options
function parseQueryString() {
  var queryStrOptions = getQueryStringOptions();
  setToggleOptions(queryStrOptions);
  if (queryStrOptions.preseededCode) {
    pyInputSetValue(queryStrOptions.preseededCode);
  }
  if (queryStrOptions.rawInputLst) {
    rawInputLst = queryStrOptions.rawInputLst; // global
  }
  else {
    rawInputLst = [];
  }

  if (queryStrOptions.codeopticonSession) {
    assert(false); // TODO: this won't currently work with Webpack, so fix it later
    codeopticonSession = queryStrOptions.codeopticonSession; // GLOBAL defined in codeopticon-learner.js
    codeopticonUsername = queryStrOptions.codeopticonUsername; // GLOBAL defined in codeopticon-learner.js
  }

  if (queryStrOptions.testCasesLst && typeof(loadTestCases) !== 'undefined') {
    loadTestCases(queryStrOptions.testCasesLst);
  }

  // ugh tricky -- always start in edit mode by default, and then
  // switch to display mode only after the code successfully executes
  appMode = 'edit';
  if ((queryStrOptions.appMode == 'display' ||
       queryStrOptions.appMode == 'visualize' /* 'visualize' is deprecated */) &&
      queryStrOptions.preseededCode /* jump to display only with pre-seeded code */) {
    executeCode(queryStrOptions.preseededCurInstr); // will switch to 'display' mode
  }
  $.bbq.removeState(); // clean up the URL no matter what
}

// parsing the URL query string hash
function getQueryStringOptions() {
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

function setToggleOptions(dat) {
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

// get the ENTIRE current state of the app
function getAppState() {
  assert(originFrontendJsFile); // global var defined in each frontend

  var ret = {code: pyInputGetValue(),
             mode: appMode,
             origin: originFrontendJsFile,
             cumulative: $('#cumulativeModeSelector').val(),
             heapPrimitives: $('#heapPrimitivesSelector').val(),
             textReferences: $('#textualMemoryLabelsSelector').val(),
             py: $('#pythonVersionSelector').val(),
             /* ALWAYS JSON serialize rawInputLst, even if it's empty! */
             rawInputLstJSON: JSON.stringify(rawInputLst),
             curInstr: myVisualizer ? myVisualizer.curInstr : undefined};

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
  if (typeof(appStateAugmenter) !== 'undefined') {
    appStateAugmenter(ret);
  }
  return ret;
}

// return whether two states match, except don't worry about curInstr
function appStateEq(s1, s2) {
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
function getToggleState() {
  var x = getAppState();
  delete x.code;
  delete x.mode;
  delete x.rawInputLstJSON;
  delete x.curInstr;
  return x;
}

// sets the global appMode variable if relevant and also the URL hash to
// support some amount of Web browser back button goodness
function updateAppDisplay(newAppMode) {
  // idempotence is VERY important here
  if (newAppMode == appMode) {
    return;
  }

  appMode = newAppMode; // global!

  if (appMode === undefined || appMode == 'edit' ||
      !myVisualizer /* subtle -- if no visualizer, default to edit mode */) {
    appMode = 'edit'; // canonicalize

    $("#pyInputPane").show();
    $("#pyOutputPane").hide();
    $("#embedLinkDiv").hide();

    $(".surveyQ").val(''); // clear all survey results when user hits forward/back

    // Potentially controversial: when you enter edit mode, DESTROY any
    // existing visualizer object. note that this simplifies the app's
    // conceptual model but breaks the browser's expected Forward and
    // Back button flow
    $("#pyOutputPane").empty();
    // right before destroying, submit the visualizer's updateHistory
    submitUpdateHistory('editMode');
    myVisualizer = null;

    $(document).scrollTop(0); // scroll to top to make UX better on small monitors

    var s: any = { mode: 'edit' };
    // keep these persistent so that they survive page reloads
    // keep these persistent so that they survive page reloads
    if (typeof codeopticonSession !== "undefined") {s.cosession = codeopticonSession;}
    if (typeof codeopticonUsername !== "undefined") {s.couser = codeopticonUsername;}
    $.bbq.pushState(s, 2 /* completely override other hash strings to keep URL clean */);
  }
  else if (appMode == 'display' || appMode == 'visualize' /* 'visualize' is deprecated */) {
    assert(myVisualizer);
    appMode = 'display'; // canonicalize

    $("#pyInputPane").hide();
    $("#pyOutputPane").show();
    $("#embedLinkDiv").show();

    if (typeof TogetherJS === 'undefined' || !TogetherJS.running) {
      $("#surveyHeader").show();
    }

    doneExecutingCode();

    // do this AFTER making #pyOutputPane visible, or else
    // jsPlumb connectors won't render properly
    myVisualizer.updateOutput();

    // customize edit button click functionality AFTER rendering (NB: awkward!)
    $('#pyOutputPane #editCodeLinkDiv').show();
    $('#pyOutputPane #editBtn').click(function() {
      enterEditMode();
    });
    var v = $('#pythonVersionSelector').val();
    if (v === 'js' || v === '2' || v === '3') {
      var myArgs = getAppState();
      var urlStr = $.param.fragment('live.html', myArgs, 2 /* clobber all */);
      $("#pyOutputPane #liveModeSpan").show();
      $('#pyOutputPane #editLiveModeBtn').click(function() {
        var myArgs = getAppState();
        var urlStr = $.param.fragment('live.html', myArgs, 2 /* clobber all */);
        window.open(urlStr); // open in new tab

        return false; // to prevent default "a href" click action
      });
    } else {
      $("#pyOutputPane #liveModeSpan").hide();
    }

    $(document).scrollTop(0); // scroll to top to make UX better on small monitors


    // NASTY global :(
    if (pendingCodeOutputScrollTop) {
      myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(pendingCodeOutputScrollTop);
      pendingCodeOutputScrollTop = null;
    }

    $.doTimeout('pyCodeOutputDivScroll'); // cancel any prior scheduled calls

    // TODO: this might interfere with experimentalPopUpSyntaxErrorSurvey (2015-04-19)
    myVisualizer.domRoot.find('#pyCodeOutputDiv').scroll(function(e) {
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
  }
  else {
    assert(false);
  }

  $('#urlOutput,#embedCodeOutput').val(''); // clear to avoid stale values

  // log at the end after appMode gets canonicalized
  logEventCodeopticon({type: 'updateAppDisplay', mode: appMode, appState: getAppState()});
}


function executeCodeFromScratch() {
  // don't execute empty string:
  if (pyInputAceEditor && $.trim(pyInputGetValue()) == '') {
    setFronendError(["Type in some code to visualize."]);
    return;
  }

  rawInputLst = []; // reset!
  executeCode();
}

function executeCodeWithRawInput(rawInputStr, curInstr) {
  rawInputLst.push(rawInputStr);
  console.log('executeCodeWithRawInput', rawInputStr, curInstr, rawInputLst);
  executeCode(curInstr);
}


function handleUncaughtExceptionFunc(trace) {
  if (trace.length == 1 && trace[0].line) {
    var errorLineNo = trace[0].line - 1; /* Ace lines are zero-indexed */
    if (errorLineNo !== undefined && errorLineNo != NaN) {
      // highlight the faulting line
      var s = pyInputAceEditor.getSession();
      s.setAnnotations([{row: errorLineNo,
                         column: null, /* for TS typechecking */
                         type: 'error',
                         text: trace[0].exception_msg}]);
      pyInputAceEditor.gotoLine(errorLineNo + 1 /* one-indexed */);
      // if we have both a line and column number, then move over to
      // that column. (going to the line first prevents weird
      // highlighting bugs)
      if (trace[0].col !== undefined) {
        pyInputAceEditor.moveCursorTo(errorLineNo, trace[0].col);
      }
      pyInputAceEditor.focus();
    }
  }
}

function startExecutingCode() {
  $('#executeBtn').html("Please wait ... executing (takes up to 10 seconds)");
  $('#executeBtn').attr('disabled', true);
  isExecutingCode = true; // nasty global
}

function doneExecutingCode() {
  $('#executeBtn').html("Visualize Execution");
  $('#executeBtn').attr('disabled', false);
  isExecutingCode = false; // nasty global
}

function enterDisplayMode() {
  updateAppDisplay('display');
}

function enterEditMode() {
  updateAppDisplay('edit');
}


function optFinishSuccessfulExecution() {
  enterDisplayMode(); // do this first!

  // 2014-05-25: implemented more detailed tracing for surveys
  myVisualizer.creationTime = new Date().getTime();
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
  myVisualizer.updateHistory = [];
  myVisualizer.updateHistory.push([myVisualizer.curInstr,
                                   myVisualizer.creationTime,
                                   myVisualizer.curTrace.length]);
}


// TODO: cut reliance on the nasty rawInputLst global
function executeCodeAndCreateViz(codeToExec,
                                 pyState, backendOptionsObj,
                                 frontendOptionsObj,
                                 outputDiv,
                                 handleSuccessFunc, handleUncaughtExceptionFunc) {
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

        handleUncaughtExceptionFunc(trace);

        if (trace.length == 1) {
          killerException = trace[0]; // killer!
          setFronendError([trace[0].exception_msg]);
        }
        else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
          killerException = trace[trace.length - 1]; // killer!
          setFronendError([trace[trace.length - 1].exception_msg]);
        }
        else {
          setFronendError(["Unknown error. Reload the page and try again. Or report a bug to",
                           "philip@pgbovine.net by clicking on the 'Generate permanent link'",
                           "button at the bottom and including a URL in your email."]);
        }
      }
      else {
        // fail-soft to prevent running off of the end of trace
        if (frontendOptionsObj.startingInstruction >= trace.length) {
          frontendOptionsObj.startingInstruction = 0;
        }

        if (frontendOptionsObj.runTestCaseCallback) {
          // hacky! DO NOT actually create a visualization! instead call:
          frontendOptionsObj.runTestCaseCallback(trace);
        } else {
          myVisualizer = new pytutor.ExecutionVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);

          myVisualizer.add_pytutor_hook("end_updateOutput", function(args) {
            if (updateOutputSignalFromRemote) {
              return;
            }
            if (typeof TogetherJS !== 'undefined' && TogetherJS.running && !isExecutingCode) {
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
        if (myVisualizer) {
          myVisualizer.backendOptionsObj = backendOptionsObj;
        }

        handleSuccessFunc();

        // VERY SUBTLE -- reinitialize TogetherJS so that it can detect
        // and sync any new elements that are now inside myVisualizer
        if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
          TogetherJS.reinitialize();
        }
      }

      doneExecutingCode(); // rain or shine, we're done executing!
      // run this at the VERY END after all the dust has settled

      // do logging at the VERY END after the dust settles ...
      // and don't do it for iframe-embed.js since getAppState doesn't
      // work in that case ...
      if (originFrontendJsFile !== 'iframe-embed.js') {
        logEventCodeopticon({type: 'doneExecutingCode',
                  appState: getAppState(),
                  // enough to reconstruct the ExecutionVisualizer object
                  backendDataJSON: JSON.stringify(dataFromBackend), // for easier transport and compression
                  frontendOptionsObj: frontendOptionsObj,
                  backendOptionsObj: backendOptionsObj,
                  killerException: killerException, // if there's, say, a syntax error
                  });
      }

      // tricky hacky reset
      num414Tries = 0;
    }

    if (!backendScript) {
      setFronendError(["Server configuration error: No backend script",
                       "Report a bug to philip@pgbovine.net by clicking on the 'Generate permanent link'",
                       "button at the bottom and including a URL in your email."]);
      return;
    }

    if (typeof TogetherJS !== 'undefined' &&
        TogetherJS.running && !executeCodeSignalFromRemote) {
      TogetherJS.send({type: "executeCode",
                       myAppState: getAppState(),
                       forceStartingInstr: frontendOptionsObj.startingInstruction,
                       rawInputLst: rawInputLst});
    }

    snapshotCodeDiff(); // do ONE MORE snapshot before we execute, or else
                        // we'll miss a diff if the user hits Visualize Execution
                        // very shortly after finishing coding
    if (deltaObj) {
      deltaObj.executeTime = new Date().getTime();
    }

    // if you're in display mode, kick back into edit mode before
    // executing or else the display might not refresh properly ... ugh
    // krufty FIXME
    enterEditMode();

    clearFrontendError();
    startExecutingCode();

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
    var deltaObjStringified = (deltaObj && (deltaObj.deltas.length > 0)) ? JSON.stringify(deltaObj) : null;
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
             session_uuid: sessionUUID,
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
        success: execCallback,
      });
    } else {
      // Python 2 or 3
      assert (pyState === '2' || pyState === '3');
      $.get(backendScript,
            {user_script : codeToExec,
             raw_input_json: rawInputLst.length > 0 ? JSON.stringify(rawInputLst) : '',
             options_json: JSON.stringify(backendOptionsObj),
             user_uuid: supports_html5_storage() ? localStorage.getItem('opt_uuid') : undefined,
             session_uuid: sessionUUID,
             diffs_json: deltaObjStringified},
             execCallback, "json");
    }

    initDeltaObj(); // clear deltaObj to start counting over again
}


// Compress updateHistory before encoding and sending to
// the server so that it takes up less room in the URL. Have each
// entry except for the first be a delta from the FIRST entry.
function compressUpdateHistoryList(myVisualizer) {
  assert(myVisualizer);
  var uh = myVisualizer.updateHistory;
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
    encodedUh.push([myVisualizer.curInstr, curTs - firstTs]);
  }
  return encodedUh;
}

// this feature was deployed on 2015-09-17, so check logs for
// viz_interaction.py
function submitUpdateHistory(why) {
  if (myVisualizer) {
    var encodedUh = compressUpdateHistoryList(myVisualizer);
    var encodedUhJSON = JSON.stringify(encodedUh);

    var myArgs: any = {session_uuid: sessionUUID,
                  updateHistoryJSON: encodedUhJSON};
    if (why) {
      myArgs.why = why;
    }
    $.get('viz_interaction.py', myArgs, function(dat) {});
  }
}


function getBaseBackendOptionsObj() {
  var ret = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
             heap_primitives: ($('#heapPrimitivesSelector').val() == 'true'),
             show_only_outputs: false,
             origin: originFrontendJsFile};

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
            };
  return ret;
}


/* For survey questions. Versions of survey wording:

[see ../../v3/js/opt-frontend-common.js for older versions of survey wording - v1 to v7]

v8: (deployed on 2016-06-20) - like v7 except emphasize the main usage survey more, and have the over-60 survey as auxiliary
*/
var survey_v8 = '\n\
<p style="font-size: 10pt; margin-top: 10px; margin-bottom: 15px; line-height: 175%;">\n\
<span>Support our research and keep this tool free by <a href="https://docs.google.com/forms/d/1-aKilu0PECHZVRSIXHv8vJpEuKUO9uG3MrH864uX56U/viewform" target="_blank">filling out this user survey</a>.</span>\n\
<br/>\n\
<span style="font-size: 9pt;">If you are <b>at least 60 years old</b>, please also fill out <a href="https://docs.google.com/forms/d/1lrXsE04ghfX9wNzTVwm1Wc6gQ5I-B4uw91ACrbDhJs8/viewform" target="_blank">our survey about learning programming</a>.</span>\n\
</p>'

function setSurveyHTML() {
  $('#surveyPane').html(survey_v8);
}

// empty stub so that our code doesn't crash.
// override this with a version in codeopticon-learner.js if needed
function logEventCodeopticon(obj) {}


// TODO: abstract this better
// only export methods and NOT objects, since they're copied by value
// (unless they're constants, in which case they can be exported at the
// end after they've been initialized)
declare var module: any;
module.exports = {
  setSurveyHTML: setSurveyHTML,
  genericOptFrontendReady: genericOptFrontendReady,
  supports_html5_storage: supports_html5_storage, // maybe move into a utils.js?
  setAceMode: setAceMode,
  pyInputSetValue: pyInputSetValue,
  pyInputGetValue: pyInputGetValue,
  pyInputSetScrollTop: pyInputSetScrollTop,
  pyInputGetScrollTop: pyInputGetScrollTop,
  executeCodeWithRawInput: executeCodeWithRawInput,
  executeCodeAndCreateViz: executeCodeAndCreateViz,
  optFinishSuccessfulExecution: optFinishSuccessfulExecution,
  handleUncaughtExceptionFunc: handleUncaughtExceptionFunc,
  populateTogetherJsShareUrl: populateTogetherJsShareUrl,
  getAppState: getAppState,
  getAppMode: getAppMode,
  getBaseBackendOptionsObj: getBaseBackendOptionsObj,
  getBaseFrontendOptionsObj: getBaseFrontendOptionsObj,
  getVisualizer: getVisualizer,
  setVisualizer: setVisualizer,
  getRawInputLst: getRawInputLst,
  setRawInputLst: setRawInputLst,
  executeCodeFromScratch: executeCodeFromScratch,
  setFronendError: setFronendError,
  clearFrontendError: clearFrontendError,
  startExecutingCode: startExecutingCode,
  doneExecutingCode: doneExecutingCode,
  getSessionUUID: getSessionUUID,
  getAceEditor: getAceEditor,
  setAceEditor: setAceEditor,
  compressUpdateHistoryList: compressUpdateHistoryList,
  getQueryStringOptions: getQueryStringOptions,
  initializeFrontendParams: initializeFrontendParams,
  JS_JSONP_ENDPOINT: JS_JSONP_ENDPOINT, // TODO: get rid of me
}
