/*

Online Python Tutor
https://github.com/pgbovine/OnlinePythonTutor/

Copyright (C) Philip J. Guo (philip@pgbovine.net)

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

// include this file BEFORE any OPT frontend file


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
//var python2_backend_script = 'web_exec_py2.py';
//var python3_backend_script = 'web_exec_py3.py';

// uncomment below if you're running on Google App Engine using the built-in app.yaml
var python2_backend_script = 'exec';
var python3_backend_script = 'exec';

// KRAZY experimental KODE!!! Use a custom hacked CPython interpreter
var python2crazy_backend_script = 'web_exec_py2-crazy.py';
// On Google App Engine, simply run dev_appserver.py with the
// crazy custom py2crazy CPython interpreter to get 2crazy mode
//var python2crazy_backend_script = 'exec';


var domain = "http://pythontutor.com/"; // for deployment
//var domain = "http://localhost:8080/"; // for Google App Engine local testing


var isExecutingCode = false; // nasty, nasty global


var appMode = 'edit'; // 'edit' or 'display'. also support
                      // 'visualize' for backward compatibility (same as 'display')

var pyInputCodeMirror; // CodeMirror object that contains the input code
var pyInputAceEditor; // Ace editor object that contains the input code

var useCodeMirror = false; // true -> use CodeMirror, false -> use Ace


var loggingSocketIO; // socket.io instance -- optional: not all frontends use it

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


var dmp = new diff_match_patch();
var curCode = '';
var deltaObj = undefined;

function initDeltaObj() {
  // make sure the editor already exists
  // (editor doesn't exist when you're, say, doing an iframe embed)
  if (!pyInputAceEditor && !pyInputCodeMirror) {
    return;
  }

  // v is the version number
  //   1 (version 1 was released on 2014-11-05)
  deltaObj = {start: pyInputGetValue(), deltas: [], v: 1};
}

function initAceEditor(height) {
  pyInputAceEditor = ace.edit('codeInputPane');
  var s = pyInputAceEditor.getSession();
  s.setMode("ace/mode/python");
  // tab -> 4 spaces
  s.setTabSize(4);
  s.setUseSoftTabs(true);
  // disable extraneous indicators:
  s.setFoldStyle('manual'); // no code folding indicators
  pyInputAceEditor.setHighlightActiveLine(false);
  pyInputAceEditor.setShowPrintMargin(false);
  pyInputAceEditor.setBehavioursEnabled(false);

  $('#codeInputPane').css('width', '700px');
  $('#codeInputPane').css('height', height + 'px');

  initDeltaObj();
  pyInputAceEditor.on('change', function(e) {
    $.doTimeout('pyInputAceEditorChange', 1000, snapshotCodeDiff); // debounce
  });
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
    logEvent({type: 'editCode', delta: delta});
  }
}

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


// BEGIN - shared session stuff

// grab this as early as possible before TogetherJS munges the URL
var togetherjsInUrl = ($.bbq.getState('togetherjs') !== undefined);

//var TogetherJSConfig_hubBase = "http://184.173.101.176:30035/"; // online
var TogetherJSConfig_hubBase = "http://localhost:30035/"; // local

// TogetherJS common configuration
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
  if (TogetherJS.running) {
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
  if (togetherjsInUrl) {
    $("#sharedSessionBtn").hide(); // hide ASAP!
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

  // Global hook for ExecutionVisualizer.
  // Set it here after TogetherJS gets defined, hopefully!
  try_hook = function(hook_name, args) {
    if (hook_name == "end_updateOutput") {
      if (updateOutputSignalFromRemote) {
        return;
      }
      if (TogetherJS.running && !isExecutingCode) {
        TogetherJS.send({type: "updateOutput", step: args.myViz.curInstr});
      }

      // debounce to compress a bit ... 250ms feels "right"
      $.doTimeout('updateOutputLogEvent', 250, function() {
        logEvent({type: 'updateOutput', step: args.myViz.curInstr});
      });

      // 2014-05-25: implemented more detailed tracing for surveys
      if (args.myViz.creationTime) {
        var deltaMs = (new Date()) - args.myViz.creationTime;

        var uh = args.myViz.updateHistory;
        assert(uh.length > 0); // should already be seeded with an initial value
        var lastDeltaMs = uh[uh.length - 1][1];

        // ("debounce" entries that are less than 1 second apart to
        // compress the logs a bit when there's rapid scrubbing or scrolling)
        if ((deltaMs - lastDeltaMs) < 1000) {
          uh.pop(); // get rid of last entry before pushing a new entry
        }
        uh.push([args.myViz.curInstr, deltaMs]);
        //console.log(JSON.stringify(uh));
      }
    }
    return [false];
  }

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
      // give pyInputCodeMirror/pyInputAceEditor a bit of time to settle with
      // its new value. this is hacky; ideally we have a callback function for
      // when setValue() completes.
      $.doTimeout('pyInputCodeMirrorInit', 200, function() {
        pyInputSetScrollTop(msg.codeInputScrollTop);
      });
    }
  });

  TogetherJS.hub.on("codeInputScroll", function(msg) {
    // do NOT use a msg.sameUrl guard since that will miss some signals
    // due to our funky URLs
    if (useCodeMirror) {
      pyInputSetScrollTop(msg.scrollTop);
    }
    else {
      // don't sync for Ace since I can't get it working properly yet
    }
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
    $("#sharedSessionBtn").hide();

    // send this to the server for the purposes of logging, but other
    // clients shouldn't do anything with this data
    if (TogetherJS.running) {
      TogetherJS.send({type: "initialAppState",
                       myAppState: getAppState(),
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
    $("#sharedSessionBtn").show();

    TogetherjsCloseHandler(); // needs to be defined in each frontend
    redrawConnectors(); // update all arrows at the end
  });
}

function TogetherjsReadyHandler() {
  alert("ERROR: need to override TogetherjsReadyHandler()");
}

function TogetherjsCloseHandler() {
  alert("ERROR: need to override TogetherjsCloseHandler()");
}

function startSharedSession() {
  $("#sharedSessionBtn").hide(); // hide ASAP!
  $("#togetherjsStatus").html("Please wait ... loading shared session");
  TogetherJS();
}

function populateTogetherJsShareUrl() {
  // without anything after the '#' in the hash
  var cleanUrl = $.param.fragment(location.href, {}, 2 /* override */);
  var urlToShare = cleanUrl + 'togetherjs=' + TogetherJS.shareId();
  $("#togetherjsStatus").html('<div>\
                               Copy and send this URL to let someone (e.g., a tutor or friend) join your session:\
                               </div>\
                               <input type="text" style="font-size: 10pt; \
                               font-weight: bold; padding: 3px;\
                               margin-bottom: 6pt;" \
                               id="togetherjsURL" size="80" readonly="readonly"/>\
                               <button id="syncBtn" type="button">Force sync</button>\
                               ');
  $("#togetherjsURL").val(urlToShare).attr('size', urlToShare.length + 20);
  $("#syncBtn").click(requestSync);

  // append post shared session survey
  $("#togetherjsStatus").append(postSessionSurvey);
  $('.star-rating :radio').change(function() {
    if (TogetherJS.running) {
      TogetherJS.send({type: "surveyHowUsefulStars",
                       stars: Number(this.value)});
    }
  });

  $('#submitSessionSurveyBtn').click(function() {
    var resp = $('#sharedSessionWhatLearned').val();
    if (TogetherJS.running && resp) {
      TogetherJS.send({type: "surveyFreetextQuestion",
                       question: "What did you just learn?",
                       answer: $('#sharedSessionWhatLearned').val()});

      $("#sharedSessionWhatLearned").val('');
      $("#sharedSessionWhatLearnedThanks").show();
      $.doTimeout('sharedSessionWhatLearnedThanksFadeOut', 1000, function() {
        $("#sharedSessionWhatLearnedThanks").fadeOut(2000);
      });
    }
  });
}

// END - shared session stuff


// Global hook for ExecutionVisualizer.
var try_hook = function(hook_name, args) {
  return [false]; // just a stub
}

var myVisualizer = null; // singleton ExecutionVisualizer instance

var rawInputLst = []; // a list of strings inputted by the user in response to raw_input or mouse_input events


// each frontend must implement its own executeCode function
function executeCode() {
  alert("Configuration error. Need to override executeCode(). This is an empty stub.");
}

function redrawConnectors() {
  if (appMode == 'display' || appMode == 'visualize' /* deprecated */) {
    if (myVisualizer) {
      myVisualizer.redrawConnectors();
    }
  }
}

function setFronendError(lines) {
  $("#frontendErrorOutput").html(lines.map(htmlspecialchars).join('<br/>'));
  $("#frontendErrorOutput").show();
}

function clearFrontendError() {
  $("#frontendErrorOutput").hide();
}


// From http://diveintohtml5.info/storage.html
function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

// abstraction so that we can use either CodeMirror or Ace as our code editor
function pyInputGetValue() {
  if (useCodeMirror) {
    return pyInputCodeMirror.getValue();
  }
  else {
    return pyInputAceEditor.getValue();
  }
}

function pyInputSetValue(dat) {
  if (useCodeMirror) {
    pyInputCodeMirror.setValue(dat.rtrim() /* kill trailing spaces */);
  }
  else {
    pyInputAceEditor.setValue(dat.rtrim() /* kill trailing spaces */,
                              -1 /* do NOT select after setting text */);
  }

  $('#urlOutput,#embedCodeOutput').val('');

  clearFrontendError();

  // also scroll to top to make the UI more usable on smaller monitors
  $(document).scrollTop(0);
}


var codeMirrorScroller = '#codeInputPane .CodeMirror-scroll';

function pyInputGetScrollTop() {
  if (useCodeMirror) {
    return $(codeMirrorScroller).scrollTop();
  }
  else {
    return pyInputAceEditor.getSession().getScrollTop();
  }
}

function pyInputSetScrollTop(st) {
  if (useCodeMirror) {
    $(codeMirrorScroller).scrollTop(st);
  }
  else {
    pyInputAceEditor.getSession().setScrollTop(st);
  }
}


// run at the END so that everything else can be initialized first
function genericOptFrontendReady() {
  initTogetherJS(); // initialize early


  // be friendly to the browser's forward and back buttons
  // thanks to http://benalman.com/projects/jquery-bbq-plugin/
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

    if (TogetherJS.running && !isExecutingCode) {
      TogetherJS.send({type: "hashchange",
                       appMode: appMode,
                       codeInputScrollTop: pyInputGetScrollTop(),
                       myAppState: getAppState()});
    }
  });


  if (useCodeMirror) {
    pyInputCodeMirror = CodeMirror(document.getElementById('codeInputPane'), {
      mode: 'python',
      lineNumbers: true,
      tabSize: 4,
      indentUnit: 4,
      // convert tab into four spaces:
      extraKeys: {Tab: function(cm) {cm.replaceSelection("    ", "end");}}
    });

    pyInputCodeMirror.setSize(null, '420px');
  }
  else {
    initAceEditor(420);
  }


  if (useCodeMirror) {
    // for shared sessions
    pyInputCodeMirror.on("change", function(cm, change) {
      // only trigger when the user explicitly typed something
      if (change.origin != 'setValue') {
        if (TogetherJS.running) {
          TogetherJS.send({type: "codemirror-edit"});
        }
      }
    });
  }
  else {
    pyInputAceEditor.getSession().on("change", function(e) {
      // unfortunately, Ace doesn't detect whether a change was caused
      // by a setValue call
      if (TogetherJS.running) {
        TogetherJS.send({type: "codemirror-edit"});
      }
    });
  }


  if (useCodeMirror) {
    $(codeMirrorScroller).scroll(function(e) {
      if (TogetherJS.running) {
        var elt = $(this);
        $.doTimeout('codeInputScroll', 100, function() { // debounce
          // note that this will send a signal back and forth both ways
          // (there's no easy way to prevent this), but it shouldn't keep
          // bouncing back and forth indefinitely since no the second signal
          // causes no additional scrolling
          TogetherJS.send({type: "codeInputScroll",
                           scrollTop: elt.scrollTop()});
        });
      }
    });
  }
  else {
    // don't sync for Ace since I can't get it working properly yet
    /*
    pyInputAceEditor.getSession().on('changeScrollTop', function() {
      if (TogetherJS.running) {
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
  }


  // first initialize options from HTML LocalStorage. very important
  // that this code runs first so that options get overridden by query
  // string options and anything else the user wants to override with.
  if (supports_html5_storage()) {
    var lsKeys = ['cumulative',
                  'drawParentPointers',
                  'heapPrimitives',
                  'py',
                  'showOnlyOutputs',
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
    $('#cumulativeModeSelector,#heapPrimitivesSelector,#drawParentPointerSelector,#textualMemoryLabelsSelector,#showOnlyOutputsSelector,#pythonVersionSelector').change(function() {
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
    $('#urlOutput').val(urlStr);
  });


  // register a generic AJAX error handler
  $(document).ajaxError(function(evt, jqxhr, settings, exception) {
    // ignore errors related to togetherjs stuff:
    if (settings.url.indexOf('togetherjs') > -1) {
      return; // get out early
    }

    // ugh other idiosyncratic stuff
    if (settings.url.indexOf('name_lookup.py') > -1) {
      return; // get out early
    }

    setFronendError(["Server error! Your code might be taking too much time to run or using too much memory.",
                     "Also, this tool does not work on raw_input(), input() and bytearray() in some cases.",
                     "Report a bug to philip@pgbovine.net by clicking the 'Generate permanent link' button",
                     "at the bottom of this page and including a URL in your email."]);

    doneExecutingCode();
  });

  clearFrontendError();

  $("#embedLinkDiv").hide();
  $("#executeBtn").attr('disabled', false);
  $("#executeBtn").click(executeCodeFromScratch);

  // for Versions 1 and 2, initialize here. But for version 3+, dynamically
  // generate a survey whenever the user successfully executes a piece of code
  //initializeDisplayModeSurvey();
}


// sets globals such as rawInputLst, CodeMirror input box, and toggle options
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
  // note that any of these can be 'undefined'
  return {preseededCode: $.bbq.getState('code'),
          preseededCurInstr: Number($.bbq.getState('curInstr')),
          verticalStack: $.bbq.getState('verticalStack'),
          appMode: $.bbq.getState('mode'),
          py: $.bbq.getState('py'),
          cumulative: $.bbq.getState('cumulative'),
          heapPrimitives: $.bbq.getState('heapPrimitives'),
          drawParentPointers: $.bbq.getState('drawParentPointers'),
          textReferences: $.bbq.getState('textReferences'),
          showOnlyOutputs: $.bbq.getState('showOnlyOutputs'),
          rawInputLst: ril ? $.parseJSON(ril) : undefined
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
  if (dat.drawParentPointers !== undefined) {
    $('#drawParentPointerSelector').val(dat.drawParentPointers);
  }
  if (dat.textReferences !== undefined) {
    $('#textualMemoryLabelsSelector').val(dat.textReferences);
  }
  if (dat.showOnlyOutputs !== undefined) {
    $('#showOnlyOutputsSelector').val(dat.showOnlyOutputs);
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
             drawParentPointers: $('#drawParentPointerSelector').val(),
             textReferences: $('#textualMemoryLabelsSelector').val(),
             showOnlyOutputs: $('#showOnlyOutputsSelector').val(),
             py: $('#pythonVersionSelector').val(),
             /* ALWAYS JSON serialize rawInputLst, even if it's empty! */
             rawInputLstJSON: JSON.stringify(rawInputLst),
             curInstr: myVisualizer ? myVisualizer.curInstr : undefined};

  // keep this really clean by avoiding undefined values
  if (ret.cumulative === undefined)
    delete ret.cumulative;
  if (ret.heapPrimitives === undefined)
    delete ret.heapPrimitives;
  if (ret.drawParentPointers === undefined)
    delete ret.drawParentPointers;
  if (ret.textReferences === undefined)
    delete ret.textReferences;
  if (ret.showOnlyOutputs === undefined)
    delete ret.showOnlyOutputs;
  if (ret.py === undefined)
    delete ret.py;
  if (ret.rawInputLstJSON === undefined)
    delete ret.rawInputLstJSON;
  if (ret.curInstr === undefined)
    delete ret.curInstr;

  return ret;
}

// return whether two states match, except don't worry about curInstr
function appStateEq(s1, s2) {
  assert(s1.origin == s2.origin); // sanity check!

  return (s1.code == s2.code &&
          s1.mode == s2.mode &&
          s1.cumulative == s2.cumulative &&
          s1.heapPrimitives == s1.heapPrimitives &&
          s1.drawParentPointers == s2.drawParentPointers &&
          s1.textReferences == s2.textReferences &&
          s1.showOnlyOutputs == s2.showOnlyOutputs &&
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
    $("#pyOutputPane,#surveyHeader").hide();
    $("#embedLinkDiv").hide();

    $(".surveyQ").val(''); // clear all survey results when user hits forward/back

    // destroy all annotation bubbles (NB: kludgy)
    if (myVisualizer) {
      myVisualizer.destroyAllAnnotationBubbles();
    }

    // Potentially controversial: when you enter edit mode, DESTROY any
    // existing visualizer object. note that this simplifies the app's
    // conceptual model but breaks the browser's expected Forward and
    // Back button flow
    $("#pyOutputPane").empty();
    myVisualizer = null;

    $(document).scrollTop(0); // scroll to top to make UX better on small monitors

    $.bbq.pushState({ mode: 'edit' }, 2 /* completely override other hash strings to keep URL clean */);
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

    $(document).scrollTop(0); // scroll to top to make UX better on small monitors


    // NASTY global :(
    if (pendingCodeOutputScrollTop) {
      myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(pendingCodeOutputScrollTop);
      pendingCodeOutputScrollTop = null;
    }

    $.doTimeout('pyCodeOutputDivScroll'); // cancel any prior scheduled calls

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

    $.bbq.pushState({ mode: 'display' }, 2 /* completely override other hash strings to keep URL clean */);
  }
  else {
    assert(false);
  }

  $('#urlOutput,#embedCodeOutput').val(''); // clear to avoid stale values

  // log at the end after appMode gets canonicalized
  logEvent({type: 'updateAppDisplay', mode: appMode, appState: getAppState()});
}


function executeCodeFromScratch() {
  // don't execute empty string:
  if ($.trim(pyInputGetValue()) == '') {
    setFronendError(["Type in some Python code to visualize."]);
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
    var errorLineNo = trace[0].line - 1; /* CodeMirror lines are zero-indexed */
    if (errorLineNo !== undefined && errorLineNo != NaN) {
      // highlight the faulting line
      if (useCodeMirror) {
        pyInputCodeMirror.focus();
        pyInputCodeMirror.setCursor(errorLineNo, 0);
        pyInputCodeMirror.addLineClass(errorLineNo, null, 'errorLine');

        function f() {
          pyInputCodeMirror.removeLineClass(errorLineNo, null, 'errorLine'); // reset line back to normal
          pyInputCodeMirror.off('change', f);
        }
        pyInputCodeMirror.on('change', f);
      }
      else {
        var s = pyInputAceEditor.getSession();
        s.setAnnotations([{row: errorLineNo,
                           type: 'error',
                           text: trace[0].exception_msg}]);
        pyInputAceEditor.gotoLine(errorLineNo + 1 /* one-indexed */);
      }
    }
  }
}

function startExecutingCode() {
  $('#executeBtn').html("Please wait ... processing your code");
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
  myVisualizer.creationTime = new Date();
  // each element will be a two-element list consisting of:
  // [step number, milliseconds elapsed since creationTime]
  // ("debounce" entries that are less than 1 second apart to
  // compress the logs a bit when there's rapid scrubbing or scrolling)
  myVisualizer.updateHistory = [];
  myVisualizer.updateHistory.push([myVisualizer.curInstr, 0]); // seed it!

  // For version 3+, dynamically generate a survey whenever the user
  // successfully executes a piece of code
  initializeDisplayModeSurvey();
}


// TODO: cut reliance on the nasty rawInputLst global
function executePythonCode(pythonSourceCode,
                           backendScript, backendOptionsObj,
                           frontendOptionsObj,
                           outputDiv,
                           handleSuccessFunc, handleUncaughtExceptionFunc) {
    if (!backendScript) {
      setFronendError(["Server configuration error: No backend script",
                       "Report a bug to philip@pgbovine.net by clicking on the 'Generate URL'",
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

    $.get(backendScript,
          {user_script : pythonSourceCode,
           raw_input_json: rawInputLst.length > 0 ? JSON.stringify(rawInputLst) : '',
           options_json: JSON.stringify(backendOptionsObj),
           user_uuid: supports_html5_storage() ? localStorage.getItem('opt_uuid') : undefined,
           // if we don't have any deltas, then don't bother sending deltaObj:
           diffs_json: deltaObj && (deltaObj.deltas.length > 0) ? JSON.stringify(deltaObj) : null},
          function(dataFromBackend) {
            var trace = dataFromBackend.trace;

            // don't enter visualize mode if there are killer errors:
            if (!trace ||
                (trace.length == 0) ||
                (trace[trace.length - 1].event == 'uncaught_exception')) {

              handleUncaughtExceptionFunc(trace);

              if (trace.length == 1) {
                setFronendError([trace[0].exception_msg]);
              }
              else if (trace[trace.length - 1].exception_msg) {
                setFronendError([trace[trace.length - 1].exception_msg]);
              }
              else {
                setFronendError(["Unknown error. Reload the page and try again.",
                                 "Report a bug to philip@pgbovine.net by clicking on the 'Generate URL'",
                                 "button at the bottom and including a URL in your email."]);
              }
            }
            else {
              // fail-soft to prevent running off of the end of trace
              if (frontendOptionsObj.startingInstruction >= trace.length) {
                frontendOptionsObj.startingInstruction = 0;
              }

              if (frontendOptionsObj.holisticMode) {
                // do NOT override, or else bad things will happen with
                // jsPlumb arrows interfering ...
                delete frontendOptionsObj.visualizerIdOverride;

                myVisualizer = new HolisticVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);
              } else {
                myVisualizer = new ExecutionVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);
              }
              // SUPER HACK -- slip in backendOptionsObj as an extra field
              myVisualizer.backendOptionsObj = backendOptionsObj;

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
            logEvent({type: 'doneExecutingCode',
                      appState: getAppState(),
                      // enough to reconstruct the ExecutionVisualizer object
                      backendDataJSON: JSON.stringify(dataFromBackend), // for easier transport and compression
                      frontendOptionsObj: frontendOptionsObj,
                      backendOptionsObj: backendOptionsObj,
                      });
          },
          "json");


    initDeltaObj(); // clear deltaObj to start counting over again
}


/* For survey questions:

Versions of survey wording:

v1: (deployed around 2014-04-09, revoked on 2014-06-20)

var survey_v1 = '\n\
<p style="margin-top: 10px; line-height: 175%;">\n\
[Optional] Please answer these questions to support our research and to help improve this tool.<br/>\n\
Where is your code from? <input type="text" id="code-origin-Q" class="surveyQ" size=60 maxlength=140/><br/>\n\
What do you hope to learn by visualizing it? <input type="text" id="what-learn-Q" class="surveyQ" size=55 maxlength=140/><br/>\n\
How did you find this web site? <input type="text" id="how-find-Q" class="surveyQ" size=60 maxlength=140/>\n\
<input type="hidden" id="Q-version" value="v1"/> <!-- for versioning -->\n\
</p>'

v2: (deployed on 2014-06-20, revoked on 2014-06-28)

var survey_v2 = '\n\
<p style="margin-top: 10px; line-height: 175%;">\n\
[Optional] Please answer these questions to support our research and to help improve this tool.<br/>\n\
What do you hope to learn by visualizing this code? <input type="text" id="what-learn-Q" class="surveyQ" size=60 maxlength=200/><br/>\n\
Paste a website link to a course that uses Python: <input type="text" id="course-website-Q" class="surveyQ" size=55 maxlength=300/><br/>\n\
<span style="font-size: 8pt; color: #666;">(This could be a course that you\'re taking or teaching in school, or that you\'ve taken or taught in the past.)</span>\n\
<input type="hidden" id="Q-version" value="v2"/> <!-- for versioning -->\n\
</p>'

v3: (deployed on 2014-06-28, revoked on 2014-07-13) [it's a simplified version of v1]
var survey_v3 = '\n\
<p style="margin-top: 10px; line-height: 175%;">\n\
[Optional] Please answer these questions to support our research and to help improve this tool.<br/>\n\
Where is your code from? <input type="text" id="code-origin-Q" class="surveyQ" size=60 maxlength=140/><br/>\n\
What do you hope to learn by visualizing it? <input type="text" id="what-learn-Q" class="surveyQ" size=55 maxlength=140/><br/>\n\
<input type="hidden" id="Q-version" value="v3"/> <!-- for versioning -->\n\
</p>'

v4: (deployed on 2014-07-13)
[an even more simplified version of v1 just to focus on ONE important question]
*/
var survey_v4 = '\n\
<p style="margin-top: 10px; line-height: 175%;">\n\
[Optional] What do you hope to learn by visualizing this code?<br/>\n\
<input type="text" id="what-learn-Q" class="surveyQ" size=80 maxlength=300/><br/>\n\
<input type="hidden" id="Q-version" value="v4"/> <!-- for versioning -->\n\
</p>'

var survey_html = survey_v4;

function setSurveyHTML() {
  $('#surveyPane').html(survey_html);
}

function getSurveyObject() {
  /* v1
  var code_origin_Q_val = $('#code-origin-Q').val();
  var what_learn_Q_val = $('#what-learn-Q').val();
  var how_find_Q_val = $('#how-find-Q').val();

  var ret = null;

  if (code_origin_Q_val || what_learn_Q_val || how_find_Q_val) {
    ret = {
      ver: $('#Q-version').val(),
      code_origin_Q: code_origin_Q_val,
      what_learn_Q: what_learn_Q_val,
      how_find_Q: how_find_Q_val,
    }
  }
  */

  /* v2
  var what_learn_Q_val = $('#what-learn-Q').val();
  var course_website_Q_val = $('#course-website-Q').val();

  var ret = null;

  if (what_learn_Q_val || course_website_Q_val) {
    ret = {
      ver: $('#Q-version').val(),
      what_learn_Q: what_learn_Q_val,
      course_website_Q: course_website_Q_val,
    }
  }
  */

  /* v3
  var code_origin_Q_val = $('#code-origin-Q').val();
  var what_learn_Q_val = $('#what-learn-Q').val();

  var ret = null;

  if (code_origin_Q_val || what_learn_Q_val) {
    ret = {
      ver: $('#Q-version').val(),
      code_origin_Q: code_origin_Q_val,
      what_learn_Q: what_learn_Q_val,
    }
  }
  */

  /* v4 */
  var ret = {
    ver: $('#Q-version').val(),
  }

  var what_learn_Q_val = $('#what-learn-Q').val();
  if ($.trim(what_learn_Q_val)) {
    ret.what_learn_Q = what_learn_Q_val;
    ret.testing_group = 'c'; // special group for users who have filled out this
                             // execution-time survey
  } else {
    // assign to 'a' or 'b' group for A/B testing:
    var grp = 'ERROR'; // default error sentinel

    // if we have localStorage, then get/set a testing_group field to ensure
    // some consistency across different sessions from the same user.
    // of course, this isn't foolproof by any means, but it's a start
    if (supports_html5_storage()) {
      var saved_grp = localStorage.getItem('testing_group');
      if (saved_grp) {
        grp = saved_grp;
      } else {
        grp = (Math.random() < 0.5) ? 'a' : 'b';
        localStorage.setItem('testing_group', grp);
      }
    } else {
      grp = (Math.random() < 0.5) ? 'a' : 'b';
    }

    ret.testing_group = grp;
  }

  return ret;
}


// survey for shared sessions, deployed on 2014-06-06
var postSessionSurvey = '\n\
<div id="postSessionSurveyDiv" style="border: 1px solid #BE554E; padding: 5px; margin-top: 5px; line-height: 175%;">\n\
<span style="font-size: 8pt; color: #666;">Support our research by giving anonymous feedback before ending your session.</span><br/>\n\
How useful was this particular session? (click star to rate)\n\
<span class="star-rating togetherjsIgnore">\n\
  <input type="radio" class="togetherjsIgnore" name="rating" value="1"/><i></i>\n\
  <input type="radio" class="togetherjsIgnore" name="rating" value="2"/><i></i>\n\
  <input type="radio" class="togetherjsIgnore" name="rating" value="3"/><i></i>\n\
  <input type="radio" class="togetherjsIgnore" name="rating" value="4"/><i></i>\n\
  <input type="radio" class="togetherjsIgnore" name="rating" value="5"/><i></i>\n\
</span>\n\
<br/>\
What did you just learn? <input type="text" id="sharedSessionWhatLearned" class="surveyQ togetherjsIgnore" size=60 maxlength=140/>\n\
<button id="submitSessionSurveyBtn" type="button" style="font-size: 8pt;">Submit</button>\n\
<span id="sharedSessionWhatLearnedThanks" style="color: #e93f34; font-weight: bold; font-size: 10pt; display: none;">Thanks!</span>\n\
</div>'


// display-mode survey, which is shown when the user is in 'display' mode
// As of Version 3, this runs every time code is executed, so make sure event
// handlers don't unnecessarily stack up
function initializeDisplayModeSurvey() {
  /* Version 1 - started experiment on 2014-04-09, put on hold on 2014-05-02

Hard-coded HTML in surveyHeader:

<div id="surveyHeader" style="margin-bottom: 5pt; display: none;">
  <div id="vizSurveyLabel" style="font-size: 8pt; color: #666;">
  Support our research by clicking a button when you see something interesting in the visualization.<br/>
  </div>
  <div>
    <button class="surveyBtn" type="button">Eureka! Now I understand.</button>
    <button class="surveyBtn" type="button">I learned something new!</button>
    <button class="surveyBtn" type="button">I found the bug in my code!</button>
    <button class="surveyBtn" type="button">This looks confusing.</button>
    <button class="surveyBtn" type="button">I have another comment.</button>
  </div>
</div>

[when any button is clicked a pop-up modal prompt tells the user to type
in some details elaborating on what they just clicked]

  $('.surveyBtn').click(function(e) {
    // wow, massive copy-and-paste action from above!
    var myArgs = getAppState();

    var buttonPrompt = $(this).html();
    var res = prompt('"' + buttonPrompt + '"' + '\nPlease elaborate if you can and hit OK to submit:');
    // don't do ajax call when Cancel button is pressed
    // (note that if OK button is pressed with no response, then an
    // empty string will still be sent to the server
    if (res !== null) {
      myArgs.surveyQuestion = buttonPrompt;
      myArgs.surveyResponse = res;
      $.get('survey.py', myArgs, function(dat) {});
    }
  });

  */

  /* Version 2 - greatly simplified and deployed on 2014-05-24, revoked on 2014-07-13

Hard-coded HTML in surveyHeader:

<div id="surveyHeader" style="display: none;">
  <div id="vizSurveyLabel" style="font-size: 8pt; color: #666; margin-bottom: 5pt;">
    <!-- 2014-06-04 tagline -->
    Support our research and help future learners by describing what you are learning.

    <!-- 2014-05-28 tagline
    Help future learners by describing what you just learned.
    -->

    <!-- 2014-05-25 tagline
    Help future learners by writing about what you are learning.
    Submit as often as you like!
    -->

    <!-- 2014-05-24 original tagline
    Help future learners by filling in this blank whenever you learn
    something new from the visualization:
     -->
  </div>
  <div style="font-size: 10pt; margin-bottom: 5pt; padding: 1pt;">
    <!-- this phrasing retired on 2014-06-04: "I just learned that" -->
    What did you just learn?
    <input style="font-size: 10pt; padding: 1pt;" type="text" id="iJustLearnedInput" size="60" maxlength=300/>

    <button id="iJustLearnedSubmission" type="button" style="font-size: 10pt;">Submit</button>

    <span id="iJustLearnedThanks"
          style="color: #e93f34; font-weight: bold; font-size: 11pt; display: none;">
      Thanks!
    </span>
  </div>
</div>

[when the user clicks the "Submit" button, send results to survey.py and
display a brief "Thanks!" note]

  $('#iJustLearnedSubmission').click(function(e) {
    var resp = $("#iJustLearnedInput").val();

    if (!$.trim(resp)) {
      return;
    }

    // wow, massive copy-and-paste action from above!
    var myArgs = getAppState();

    // myArgs.surveyQuestion = "I just learned that ..."; // retired on 2014-06-04
    myArgs.surveyQuestion = "What did you just learn?";
    myArgs.surveyResponse = resp;
    myArgs.surveyVersion = 'v2';

    // 2014-05-25: implemented more detailed tracing for surveys
    if (myVisualizer) {
      myArgs.updateHistoryJSON = JSON.stringify(myVisualizer.updateHistory);
    }

    $.get('survey.py', myArgs, function(dat) {});

    $("#iJustLearnedInput").val('');
    $("#iJustLearnedThanks").show();
    $.doTimeout('iJustLearnedThanksFadeOut', 1200, function() {
      $("#iJustLearnedThanks").fadeOut(1000);
    });
  });

  */

  /* Version 3 - deployed on 2014-07-13

  Display one of 3 display-mode surveys, depending on the contents of
  myVisualizer.backendOptionsObj.survey.testing_group

  'a' / 'b' -- A/B testing of two kinds of surveys

  'c' -- if the user has filled in an answer to 'What do you hope to
  learn by visualizing this code?' when hitting "Visualize Execution",
  then echo that phrase back to them and display a custom survey

  */
  if (!myVisualizer || !myVisualizer.backendOptionsObj.survey) {
    return;
  }

  var surveyObj = myVisualizer.backendOptionsObj.survey;

  var display_mode_survey_v3a = '\n\
      <div id="vizSurveyLabel">\n\
      Support our research by clicking a button whenever you learn something.<br/>\n\
      </div>\n\
      <div>\n\
        <button class="surveyBtn" type="button">I learned something new!</button>\n\
        <button class="surveyBtn" type="button">I found a bug in my code!</button>\n\
        <button class="surveyBtn" type="button">I cleared up a misunderstanding!</button>\n\
      </div>\n\
    </div>\n';

  var display_mode_survey_v3b = '\n\
      <div id="vizSurveyLabel">\n\
        Support our research and help future learners by describing what you are learning.\n\
      </div>\n\
      <div style="font-size: 10pt; margin-bottom: 5pt; padding: 1pt;">\n\
        What did you just learn?\n\
        <input style="font-size: 10pt; padding: 1pt;" type="text" id="iJustLearnedInput" size="60" maxlength=300/>\n\
        <button id="iJustLearnedSubmission" type="button" style="font-size: 10pt;">Submit</button>\n\
        <span id="iJustLearnedThanks"\n\
              style="color: #e93f34; font-weight: bold; font-size: 11pt; display: none;">\n\
          Thanks!\n\
        </span>\n\
      </div>';

  var display_mode_survey_v3c = '\n\
      <div id="vizSurveyLabel">\n\
      Support our research by clicking a button whenever you learn something.<br/>\n\
      </div>\n\
      <div style="margin-top: 12px;">\n\
        You hoped to learn:\n\
        "<span id="userHopeLearn"></span>"<br/>\n\
        <button class="surveyBtn" type="button">I just learned something about that topic!</button>\n\
        <button class="surveyBtn" type="button">I just learned something else new!</button>\n\
      </div>\n\
    </div>\n';

  var testingGroup = surveyObj.testing_group;

  var display_mode_survey_HTML = '';
  if (testingGroup == 'a') {
    display_mode_survey_HTML = display_mode_survey_v3a;
  } else if (testingGroup == 'b') {
    display_mode_survey_HTML = display_mode_survey_v3b;
  } else if (testingGroup == 'c') {
    display_mode_survey_HTML = display_mode_survey_v3c;
  } else {
    assert(false);
  }

  $("#surveyHeader").html(display_mode_survey_HTML);

  $("#vizSurveyLabel").css('font-size', '8pt')
                      .css('color', '#666')
                      .css('margin-bottom', '5pt');
  $(".surveyBtn").css('margin-right', '6px');

  if (testingGroup == 'c') {
    $("#userHopeLearn").html(htmlspecialchars(surveyObj.what_learn_Q));
  }


  // testingGroup == 'a' || testingGroup == 'c'
  // use unbind first so that this function is idempotent
  $('.surveyBtn').unbind().click(function(e) {
    var buttonPrompt = $(this).html();
    var res = prompt('You said, "' + buttonPrompt + '"' + '\nPlease describe what you just learned:');

    if (!$.trim(res)) {
      return;
    }

    var myArgs = getAppState();
    myArgs.surveyQuestion = buttonPrompt;
    myArgs.surveyResponse = res;
    myArgs.surveyVersion = 'v3';
    myArgs.testing_group = testingGroup; // use underscore for consistency

    myArgs.updateHistoryJSON = JSON.stringify(myVisualizer.updateHistory);

    if (surveyObj.what_learn_Q) {
      myArgs.what_learn_Q = surveyObj.what_learn_Q;
    }

    if (supports_html5_storage()) {
      myArgs.user_uuid = localStorage.getItem('opt_uuid');
    }

    $.get('survey.py', myArgs, function(dat) {});

    logEvent({type: 'survey',
              appState: getAppState(),
              surveyQuestion: myArgs.surveyQuestion,
              surveyResponse: myArgs.surveyResponse,
              surveyVersion: myArgs.surveyVersion,
              testing_group: myArgs.testing_group,
              what_learn_Q: myArgs.what_learn_Q,
              });
  });

  // testingGroup == 'b'
  // use unbind first so that this function is idempotent
  $('#iJustLearnedSubmission').unbind().click(function(e) {
    var resp = $("#iJustLearnedInput").val();

    if (!$.trim(resp)) {
      return;
    }

    var myArgs = getAppState();
    myArgs.surveyQuestion = "What did you just learn?";
    myArgs.surveyResponse = resp;
    myArgs.surveyVersion = 'v3';
    myArgs.testing_group = testingGroup; // use underscore for consistency

    myArgs.updateHistoryJSON = JSON.stringify(myVisualizer.updateHistory);

    if (supports_html5_storage()) {
      myArgs.user_uuid = localStorage.getItem('opt_uuid');
    }

    $.get('survey.py', myArgs, function(dat) {});


    $("#iJustLearnedInput").val('');
    $("#iJustLearnedThanks").show();
    $.doTimeout('iJustLearnedThanksFadeOut', 1200, function() {
      $("#iJustLearnedThanks").fadeOut(1000);
    });

    logEvent({type: 'survey',
              appState: getAppState(),
              surveyQuestion: myArgs.surveyQuestion,
              surveyResponse: myArgs.surveyResponse,
              surveyVersion: myArgs.surveyVersion,
              testing_group: myArgs.testing_group,
              });
  });
}


// using socket.io:
function logEvent(obj) {
  if (loggingSocketIO) {
    if (supports_html5_storage()) {
      obj.user_uuid = localStorage.getItem('opt_uuid');
    }
    // this probably won't match the server time due to time zones, etc.
    obj.clientTime = new Date().getTime();
    loggingSocketIO.emit('opt-client-event', obj);
  }
}
