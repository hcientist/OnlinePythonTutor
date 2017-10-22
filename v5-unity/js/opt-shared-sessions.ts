// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

// Implements shared sessions (a.k.a. Codechella)

// VERY IMPORTANT to grab the value of togetherjsInUrl before loading
// togetherjs-min.js, since loading that file deletes #togetherjs from URL
// NB: kinda gross global
//
// if this is true, this means that you JOINED SOMEONE ELSE'S SESSION
// rather than starting your own session
var togetherjsInUrl = !!(window.location.hash.match(/togetherjs=/)); // turn into bool
if (togetherjsInUrl) {
  console.log("togetherjsInUrl!");
} else {
  // if you're *not* loading a URL with togetherjs in it (i.e., joining into
  // an existing session), then do this hack at the VERY BEGINNING before
  // loading togetherjs-min.js to prevent TogetherJS from annoyingly
  // auto-starting when, say, you're in a shared session and reload
  // your browser (which can lead to weird interactions with the help queue)
  console.log("NOT togetherjsInUrl!");
  (window as any).TogetherJSConfig_noAutoStart = true;
}

require('script-loader!./lib/togetherjs/togetherjs-min.js');

require('script-loader!./lib/moment.min.js'); // https://momentjs.com/
declare var moment: any; // for TypeScript

require('script-loader!./lib/mobile-detect.min.js'); // http://hgoebl.github.io/mobile-detect.js/ https://github.com/hgoebl/mobile-detect.js
declare var MobileDetect: any; // for TypeScript

export var TogetherJS = (window as any).TogetherJS;


import {supports_html5_storage} from './opt-frontend-common';
import {OptFrontend} from './opt-frontend';
import {assert} from './pytutor';


// copy-pasta from // https://github.com/kidh0/jquery.idle
/**
 *  File: jquery.idle.js
 *  Title:  JQuery Idle.
 *  A dead simple jQuery plugin that executes a callback function if the user is idle.
 *  About: Author
 *  Henrique Boaventura (hboaventura@gmail.com).
 *  About: Version
 *  1.2.7
 *  About: License
 *  Copyright (C) 2013, Henrique Boaventura (hboaventura@gmail.com).
 *  MIT License:
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *  - The above copyright notice and this permission notice shall be included in all
 *    copies or substantial portions of the Software.
 *  - THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *    SOFTWARE.
 **/
/*jslint browser: true */
/*global jQuery: false */
(function ($) {
  'use strict';

  $.fn.idle = function (options) {
    var defaults = {
        idle: 60000, //idle time in ms
        events: 'mousemove keydown mousedown touchstart', //events that will trigger the idle resetter
        onIdle: function () {}, //callback function to be executed after idle time
        onActive: function () {}, //callback function to be executed after back from idleness
        onHide: function () {}, //callback function to be executed when window is hidden
        onShow: function () {}, //callback function to be executed when window is visible
        keepTracking: true, //set it to false if you want to track only the first time
        startAtIdle: false,
        recurIdleCall: false
      },
      idle = options.startAtIdle || false,
      visible = !options.startAtIdle || true,
      settings = $.extend({}, defaults, options),
      lastId = null,
      resetTimeout,
      timeout;

    //event to clear all idle events
    $(this).on( "idle:stop", {}, function( event) {
      $(this).off(settings.events);
      settings.keepTracking = false;
      resetTimeout(lastId, settings);
    });

    resetTimeout = function (id, settings) {
      if (idle) {
        idle = false;
        settings.onActive.call();
      }
      clearTimeout(id);
      if(settings.keepTracking) {
        return timeout(settings);
      }
    };

    timeout = function (settings) {
      var timer = (settings.recurIdleCall ? setInterval : setTimeout), id;
      id = timer(function () {
        idle = true;
        settings.onIdle.call();
      }, settings.idle);
      return id;
    };

    return this.each(function () {
      lastId = timeout(settings);
      $(this).on(settings.events, function (e) {
        lastId = resetTimeout(lastId, settings);
      });
      if (settings.onShow || settings.onHide) {
        $(document).on("visibilitychange webkitvisibilitychange mozvisibilitychange msvisibilitychange", function () {
          if (document.hidden || (document as any).webkitHidden || (document as any).mozHidden || (document as any).msHidden) {
            if (visible) {
              visible = false;
              settings.onHide.call();
            }
          } else {
            if (!visible) {
              visible = true;
              settings.onShow.call();
            }
          }
        });
      }
    });

  };
}(jQuery));



export class OptFrontendSharedSessions extends OptFrontend {
  executeCodeSignalFromRemote = false;
  togetherjsSyncRequested = false;
  pendingCodeOutputScrollTop = null;
  updateOutputSignalFromRemote = false;
  wantsPublicHelp = false;
  meInitiatedSession = false;
  disableSharedSessions = false; // if we're on mobile/tablets, disable this entirely since it doesn't work on mobile
  isIdle = false;

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

    var md = new MobileDetect(window.navigator.userAgent);
    if (md.mobile()) { // mobile or tablet device
      this.disableSharedSessions = true;
    }

    if (this.disableSharedSessions) {
      return; // early exit, so we don't do any other initialization below here ...
    }


    var ssDiv = `

<button id="requestHelpBtn" type="button" class="togetherjsBtn" style="margin-bottom: 6pt; font-weight: bold;">
Get live help! (NEW!)
</button>

<div id="ssDiv">
  <button id="sharedSessionBtn" type="button" class="togetherjsBtn" style="font-size: 9pt;">
  Start private chat session
  </button>
</div>

<div id="sharedSessionDisplayDiv" style="display: none; margin-right: 5px;">
  <button id="stopTogetherJSBtn" type="button" class="togetherjsBtn">
  Stop this chat session
  </button>

  <div style="width: 200px; font-size: 8pt; color: #666; margin-top: 8px;">
  Note that your chat logs and code may be recorded, anonymized, and
  analyzed for our research.
  </div>
</div>
`;

    var togetherJsDiv = `
<div id="togetherjsStatus">
  <div id="publicHelpQueue"></div>
</div>
`;

    $("td#headerTdLeft").append(ssDiv);
    $("td#headerTdRight").append(togetherJsDiv);

    // do this all after creating the DOM elements above dynamically:
    $("#sharedSessionBtn").click(this.startSharedSession.bind(this, false));
    $("#stopTogetherJSBtn").click(TogetherJS); // toggles off
    $("#requestHelpBtn").click(this.requestPublicHelpButtonClick.bind(this));

    // jquery.idle:
    ($(document) as any).idle({
      onIdle: () => {
        this.isIdle = true;
        console.log('I\'m idle');
      },
      onActive: () => {
        this.isIdle = false;
        console.log('I\'m back!');
        // update the help queue as soon as you're back:
        this.getHelpQueue();
      },
      idle: 60 * 1000 // 1-minute timeout by default for idleness
    })

    // polling every 5 seconds seems reasonable; note that you won't
    // send a signal to the server when this.isIdle is true, to conserve
    // resources and get a more accurate indicator of who is active at
    // the moment
    setInterval(this.getHelpQueue.bind(this), 5 * 1000);

    // add an additional listener in addition to whatever the superclasses added
    window.addEventListener("hashchange", (e) => {
      if (TogetherJS.running && !this.isExecutingCode) {
        TogetherJS.send({type: "hashchange",
                         appMode: this.appMode,
                         codeInputScrollTop: this.pyInputGetScrollTop(),
                         myAppState: this.getAppState()});
      }
    });

    // shut down TogetherJS if it's still running
    // (use 'on' to add an additional listener in addition to whatever event
    // handlers the superclasses already added)
    $(window).on('beforeunload', () => {
      if (TogetherJS.running) {
        TogetherJS();
      }
    });
    $(window).on('unload', () => {
      if (TogetherJS.running) {
        TogetherJS();
      }
    });
  }

  langToEnglish(lang) {
    if (lang === '2') {
      return 'Python 2';
    } else if (lang === '3') {
      return 'Python 3';
    } else if (lang === 'java') {
      return 'Java';
    } else if (lang === 'js') {
      return 'JavaScript';
    } else if (lang === 'ts') {
      return 'TypeScript';
    } else if (lang === 'ruby') {
      return 'Ruby';
    } else if (lang === 'c') {
      return 'C';
    } else if (lang === 'cpp') {
      return 'C++';
    }
    return '(unknown language)'; // fail soft, even though this shouldn't ever happen
  }

  getHelpQueue() {
    // VERY IMPORTANT: to avoid overloading the server, don't send these
    // requests when you're idle
    if (this.isIdle) {
      $("#publicHelpQueue").empty(); // clear when idle so that you don't have stale results
      return; // return early!
    }

    var ghqUrl = TogetherJS.config.get("hubBase").replace(/\/*$/, "") + "/getHelpQueue";
    $.ajax({
      url: ghqUrl,
      dataType: "json",
      data: {user_uuid: this.userUUID}, // tell the server who you are
      error: () => {
        console.log('/getHelpQueue error');

        if (this.wantsPublicHelp) {
          $("#publicHelpQueue").html('ERROR: help server is down. If you had previously asked for help, something is wrong; stop this session and try again later.');
        } else {
          $("#publicHelpQueue").empty(); // avoid showing stale results
        }
      },
      success: (resp) => {
        var displayEmptyQueueMsg = false;
        if (resp && resp.length > 0) {
          $("#publicHelpQueue").empty();

          var myShareId = TogetherJS.shareId();

          // if numClients > 1, that means the session has multiple
          // participants, so "demote" to those to the bottom of the
          // help queue so they're displayed last. but keep everything in order.
          var entriesWithoutHelpers = [];
          var entriesWithHelpers = [];

          resp.forEach((e) => {
            // when testing on localhost, we sometimes use the
            // production TogetherJS chat server, but we don't want to
            // show localhost entries on the global queue for people on
            // the real site since there's no way they can jump in to join
            //
            // i.e., if your browser isn't on localhost but the URL of
            // the help queue entry is on localhost, then *don't* display it
            if ((window.location.href.indexOf('localhost') < 0) &&
                (e.url.indexOf('localhost') >= 0)) {
              return;
            }

            // use moment.js to generate human-readable relative times:
            var d = new Date();
            var timeSinceCreationStr = moment(d.valueOf() - e.timeSinceCreation).fromNow();
            var timeSinceLastMsgStr = moment(d.valueOf() - e.timeSinceLastMsg).fromNow();
            var langName = this.langToEnglish(e.lang);

            var curStr = e.username;

            if (e.country && e.city) {
              // print 'region' (i.e., state) for US addresses:
              if (e.country === "United States" && e.region) {
                curStr += ' from ' + e.city + ', ' + e.region + ', US needs help with ' + langName;
              } else {
                curStr += ' from ' + e.city + ', ' + e.country + ' needs help with ' + langName;
              }
            } else if (e.country) {
              curStr += ' from ' + e.country + ' needs help with ' + langName;
            } else if (e.city) {
              curStr += ' from ' + e.city + ' needs help with ' + langName;
            } else {
              curStr += ' needs help with ' + langName;
            }

            if (e.id === myShareId) {
              curStr += ' - <span class="redBold">this is you!</span>';
              curStr += ' <button id="stopRequestHelpBtn" type="button">Stop requesting help</button>';
            } else {
              if (!e.numClients || isNaN(e.numClients) || e.numClients <= 1) {
                curStr += ' - <a class="gotoHelpLink" style="font-weight: bold;" href="' + e.url + '" target="_blank">click to help</a>';
              } else {
                curStr += ' - ' + String(e.numClients) + ' people in session';
                curStr += ' - <a class="gotoHelpLink" href="' + e.url + '" target="_blank">click to help</a>';
              }
              curStr += ' <span class="helpQueueSmallText">(requested ' + timeSinceCreationStr + ', last active ' + timeSinceLastMsgStr  + ')</span>';
            }

            if (e.numClients > 1) {
              entriesWithHelpers.push(curStr);
            } else {
              entriesWithoutHelpers.push(curStr);
            }
          });

          if ((entriesWithHelpers.length + entriesWithoutHelpers.length) > 0) {
            $("#publicHelpQueue").html('<div style="margin-bottom: 5px;">These Python Tutor users are asking for help right now. Please volunteer to help!</div>');

            // prioritize help entries that don't currently have helpers helping (i.e., numClients <= 1)
            entriesWithoutHelpers.forEach((e) => {
              $("#publicHelpQueue").append('<li>' + e + '</li>');
            });
            entriesWithHelpers.forEach((e) => {
              $("#publicHelpQueue").append('<li>' + e + '</li>');
            });

            // add these handlers AFTER the respective DOM nodes have been
            // added above:
            $("#stopRequestHelpBtn").click(() => {
              this.wantsPublicHelp = false;
              var rphUrl = TogetherJS.config.get("hubBase").replace(/\/*$/, "") + "/requestPublicHelp";
              var shareId = TogetherJS.shareId();
              $.ajax({
                url: rphUrl,
                dataType: "json",
                data: {id: shareId, removeFromQueue: true}, // stop requesting help!
                success: () => {
                  this.getHelpQueue(); // update the help queue ASAP to get updated status
                },
                error: () => {
                  this.getHelpQueue(); // update the help queue ASAP to get updated status
                },
              });
            });

            // add confirmation to hopefully establish some etiquette expectations
            $(".gotoHelpLink").click(() => {
              var confirmation = confirm('Thanks for volunteering! If you press OK, you will join a live chat session with the help requester. Please be polite and helpful in your interactions.');
              if (confirmation) {
                return true;  // cause the link to be clicked as normal
              } else {
                return false; // returning false will NOT cause the link to be clicked
              }
            });
          } else {
            displayEmptyQueueMsg = true;
          }
        } else {
          displayEmptyQueueMsg = true;
        }

        if (displayEmptyQueueMsg) {
          if (this.wantsPublicHelp) {
            $("#publicHelpQueue").html('Nobody is currently asking for help. If you had previously asked for help, something is wrong; stop this session and try again later.');
          } else {
            $("#publicHelpQueue").html('Nobody is currently asking for help using the "Get live help!" button.');
          }
        }
      },
    });
  }

  // important overrides to inject in pieces of TogetherJS functionality
  // without triggering spurious error messages
  ignoreAjaxError(settings) {
    if (settings.url.indexOf('togetherjs') > -1) {
      return true;
    } else if (settings.url.indexOf('getHelpQueue') > -1) {
      return true;
    } else if (settings.url.indexOf('requestPublicHelp') > -1) {
      return true;
    } else if (settings.url.indexOf('freegeoip') > -1) { // deprecated
      return true;
    } else {
      return super.ignoreAjaxError(settings);
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

      if (!TogetherJS.running) {
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

  // subclasses can override
  updateOutputTogetherJsHandler(msg) {
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
  }

  initTogetherJS() {
    assert(TogetherJS);

    if (togetherjsInUrl) { // kinda gross global
      $("#ssDiv,#surveyHeader").hide(); // hide ASAP!
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
            newName = toks[0] + '_' + String(count + 1); // e.g., "Tutor 3"
            count++;
          }
          else {
            // the original name was something like "Tutor", so make
            // newName into, say, "Tutor 2"
            newName = p.Self.name + '_2';
            count = 2;
          }
        } while ($.inArray(newName, peerNames) >= 0); // i.e., is newName in peerNames?

        p.Self.update({name: newName}); // change our own name
      }
    });

    TogetherJS.hub.on("updateOutput", this.updateOutputTogetherJsHandler.bind(this));

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

    // fired when TogetherJS is activated. might fire on page load if there's
    // already an open session from a prior page load in the recent past.
    TogetherJS.on("ready", () => {
      console.log("TogetherJS ready");

      $("#sharedSessionDisplayDiv").show();
      $("#ssDiv,#testCasesParent").hide();

      // send this to the server for the purposes of logging, but other
      // clients shouldn't do anything with this data
      if (TogetherJS.running) {
        TogetherJS.send({type: "initialAppState",
                         myAppState: this.getAppState(),
                         user_uuid: this.userUUID,
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

      $("#togetherjsStatus").html('<div id="publicHelpQueue"></div>'); // clear it (tricky! leave a publicHelpQueue node here!)
      $("#sharedSessionDisplayDiv").hide();
      $("#ssDiv,#requestHelpBtn,#testCasesParent").show();

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

  // TogetherJS is ready to rock and roll, so do real initiatlization all here:
  TogetherjsReadyHandler() {
    $("#surveyHeader").hide();

    // disable syntax and runtime surveys when shared sessions is on:
    this.activateSyntaxErrorSurvey = false;
    this.activateRuntimeErrorSurvey = false;
    this.activateEurekaSurvey = false;
    $("#eureka_survey").remove(); // if a survey is already displayed on-screen, then kill it

    if (this.wantsPublicHelp) {
      this.initRequestPublicHelp();
    } else {
      this.initPrivateSharedSession();
    }
  }

  TogetherjsCloseHandler() {
    if (this.appMode === "display") {
      $("#surveyHeader").show();
    }
    this.wantsPublicHelp = false; // explicitly reset it
  }

  startSharedSession(wantsPublicHelp) {
    $("#ssDiv,#surveyHeader").hide(); // hide ASAP!
    $("#togetherjsStatus").html("Please wait ... loading shared session");
    TogetherJS();
    this.wantsPublicHelp = wantsPublicHelp;
    this.meInitiatedSession = true;
  }

  requestPublicHelpButtonClick() {
    if (TogetherJS.running) {
      // TogetherJS is already running
      this.wantsPublicHelp = true;
      this.initRequestPublicHelp();
    } else {
      // TogetherJS isn't running yet, so start up a shared session AND
      // request public help at the same time ...
      this.startSharedSession(true);
    }
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

  initRequestPublicHelp() {
    assert(this.wantsPublicHelp);
    assert(TogetherJS.running);

    // first make a /requestPublicHelp request to the TogetherJS server:
    var rphUrl = TogetherJS.config.get("hubBase").replace(/\/*$/, "") + "/requestPublicHelp";
    var shareId = TogetherJS.shareId();
    var shareUrl = TogetherJS.shareUrl();
    var lang = this.getAppState().py;
    var getUserName = TogetherJS.config.get("getUserName");
    var username = getUserName();

    $.ajax({
      url: rphUrl,
      dataType: "json",
      data: {id: shareId, url: shareUrl, lang: lang, username: username},
      success: this.doneRequestingPublicHelp.bind(this),
      error: this.rphError.bind(this),
    });

  }

  rphError() {
    alert("ERROR in getting live help. This isn't working at the moment. Please try again later.");
    if (TogetherJS.running) {
      TogetherJS(); // shut down TogetherJS
    }
  }

  doneRequestingPublicHelp(resp) {
    assert(TogetherJS.running);

    if (resp.status === "OKIE DOKIE") {
      $("#togetherjsStatus").html('<div id="publicHelpQueue"></div><div style="margin-bottom: 10px;">You have requested help as username ' + TogetherJS.config.get("getUserName")() + ' (see above). Anyone currently on this website can volunteer to help you, but there is no guarantee that someone will help. <span style="color: #e93f34;">Please be patient, keep working normally, and stay on the queue.</span></div>');
      this.appendTogetherJsFooter();
      $("#requestHelpBtn").hide();
    } else {
      alert("ERROR in getting live help. This isn't working at the moment. Please try again later.");
      if (TogetherJS.running) {
        TogetherJS(); // shut down TogetherJS
      }
    }
  }

  initPrivateSharedSession() {
    assert(!this.wantsPublicHelp);

    var urlToShare = TogetherJS.shareUrl();
    var prefix;
    if (!this.meInitiatedSession) { // you've joined someone else's session
      prefix = `You have joined this chat. Thanks for helping! Please be polite and considerate in your interactions.`;
    } else { // you started your own session
      prefix = `You are in a <span style="font-weight: bold; color: #e93f34;">PRIVATE</span> chat. To ask for public help, click the "Get live help!" button at the left. Nobody will join this chat session unless you send them the URL below.`;
    }
    $("#togetherjsStatus").html('<div>' + prefix + '</div>' + `
                                 URL for others to join: <input type="text" style="font-size: 10pt;
                                 font-weight: bold; padding: 3px;
                                 margin-top: 3pt;
                                 margin-bottom: 6pt;"
                                 id="togetherjsURL" size="70" readonly="readonly"/>`);
    $("#togetherjsURL").val(urlToShare).attr('size', urlToShare.length + 20);

    this.appendTogetherJsFooter();
  }

  appendTogetherJsFooter() {
    var extraHtml = '<div style="margin-top: 3px; margin-bottom: 10px; font-size: 8pt;">This is a <span class="redBold">highly experimental</span> feature. Do not move or type too quickly. Click here if you get out of sync: <button id="syncBtn" type="button">Force sync</button> <a href="https://docs.google.com/forms/d/126ZijTGux_peoDusn1F9C1prkR226897DQ0MTTB5Q4M/viewform" target="_blank">Report bugs and feedback</a></div>'
    $("#togetherjsStatus").append(extraHtml);
    $("#syncBtn").click(this.requestSync.bind(this));
  }

} // END class OptFrontendSharedSessions
