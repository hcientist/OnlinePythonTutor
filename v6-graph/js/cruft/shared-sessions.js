// BEGIN - shared session stuff -- TODO: drastically rethink all of this!
// maybe put into a separate codechella module?
/*


  // return whether two states match, except don't worry about curInstr
  /*
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
  */


// grab this as early as possible before TogetherJS munges the URL
var togetherjsInUrl = ($.bbq.getState('togetherjs') !== undefined);

// XXX: to deploy, substitute in the online TogetherJS server URL here
var TogetherJSConfig_hubBase = "http://localhost:30035/"; // local
var TogetherJSConfig_hubBase = "http://104.237.139.253:30035/"; // online

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
  var cleanUrl = $.param.fragment(location.href, {}, 2); // 2 means 'override'

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

*/


