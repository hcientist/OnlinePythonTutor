// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

// 'codcasts' demo recorder and player for OPT
// first started hacking on it on 2018-01-01 (happy new year!)
// ... concrete idea inception around 2017-12-29, although it's been
// stewing around in my brain for a lot longer than that

/* TODOs:

  - test by recording locally (with python/js/etc. backends running on
    localhost) and then replaying remotely on pythontutor.com, since
    that's what students will ultimately be doing.
    - also make a special entry in codechella logs for tutorial replays
      so that we can EASILY FILTER THEM OUT when we're analyzing the logs
      - maybe a 'playbackRecording' event in the logs?
    - alternatively, route these to a different instance of server.js on
      another port so that it doesn't interfere with regular codechella
      (but that's more complicated to set up logistically)

  - in the video player UI, put a time indicator in seconds

  - move cursorOrSelectionChanged up to opt-shared-sessions.ts when it
    seems ready for prime time

  - in playback mode, set a more instructive username for the tutor's
    mouse pointer - and also a better and more consistent COLOR
    - #0095DD may be good (matches chat window header background)

  - ideally don't send events to the togetherjs when you're in recording
    or playback mode, so as not to overwhelm the logs. also it seems
    kinda silly that you need to connect to a remote server for this
    to work, since we don't require anything from the server
    - maybe make a mock websockets interface to FAKE a connection to the
      server so that we don't need a server at all? this seems critical
      both for performance and for being able to ship tutorials as
      self-contained packages

  - Mike Horn recommended making this like jsfiddle so that anyone can
    record these demos (either with or without audio) and i just store it
    in a local db (i'm storing user activity logs ANYWAYS) ... and just
    create shortened URLs by indexing into that db
    - if i do that, i might as well implement my own URL shortener for
      regular code URLs as well since google's URL shortener is shutting
      down, might as well!


minor-ish:

  - add title and description fields so that codcasts can serve as
    independent mini-tutorials and WORKED EXAMPLES

  - minor: save UI adjustment preferences such as the width of the code
    pane or visualizer pane so that when the video replays, it will
    preserve those widths instead of always setting them back to the
    defaults, which is helpful for users with smaller monitors
    - this is actually kinda important because resizing is a bit
      annoying

  - refactor the code so that OptDemoVideo doesn't have to know about
    GUI elements

  - things sometimes get flaky if you *ALREADY* have code in the editor
    and then try to record a demo; sometimes it doesn't work properly.

  - to prevent weird crashes from encoding mp3's in JS itself, maybe
    simply export the raw .wav files into the JSON data file, then run a
    python script offline to compress it to mp3? that would decouple the
    tutorial recording from the compressing and also give more flexibility
    to the format
    - maybe i can just use the original record to .wav program that
      Recordmp3js forked?
      - https://github.com/mattdiamond/Recorderjs
    - i already use ffmpeg to convert my vlog/podcast audio to mp3, so i
      could adapt that into my workflow as well
    - but i do like the 100% in-browser workflow since it's nice & crisp

  - NB: this recorder won't work well in live mode since we don't have a
    notion of an explicit "execute" event, so if you play back the trace
    too "slowly", then the live mode will auto-execute the code at weird
    unintended times and cause syntax errors and such; just use it in
    REGULAR visualize.html mode for now!
    - GET IT WORKING IN LIVE MODE, since i think it's doable!!!


longer-term notes:

- use codcasts as a more interactive type of WORKED EXAMPLES
   - maybe also integrate text-based annotations like subtitles at
     certain steps for mixed-media goodness

- how can we turn this into active learning activities like "here's a
  codcast, now you try something ..." and have the learner try something

- use this codcast player to replay codechella-recorded sessions so that
  i can manually review their contents

*/


import {OptFrontendSharedSessions,TogetherJS} from './opt-shared-sessions';
import {assert} from './pytutor';
import {footerHtml} from './footer-html';
import {eureka_survey,eureka_prompt,eureka_survey_version} from './surveys';
import {OptDemoVideo} from './demovideo';

require('./lib/jquery-3.0.0.min.js');
require('./lib/jquery.qtip.js');
require('../css/jquery.qtip.css');

// using this library to record audio to mp3: https://github.com/Audior/Recordmp3js
require('script-loader!./lib/recordmp3.js');
declare var Recorder: any; // for TypeScript

// lifted from Recordmp3js
function encode64(buffer) {
  var binary = '',
    bytes = new Uint8Array( buffer ),
    len = bytes.byteLength;

  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode( bytes[ i ] );
  }
  return window.btoa( binary );
}

// polyfill from https://gist.github.com/paulirish/1579671
//
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
//
// MIT license
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        (window as any).requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        (window as any).cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        (window as any).requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        (window as any).cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


export class OptDemoRecorder extends OptFrontendSharedSessions {
  originFrontendJsFile: string = 'recorder.ts'; // TODO: test to see if this works

  isRecordingDemo = false;

  audioInputStream = null;
  audioRecorder = null; // Recorder object from Recordmp3js

  constructor(params={}) {
    super(params);

    // disable all surveys:
    this.activateSyntaxErrorSurvey = false;
    this.activateRuntimeErrorSurvey = false;
    this.activateEurekaSurvey = false;

    //window.pyInputAceEditor = this.pyInputAceEditor; // STENT for debugging

    this.disableSharedSessions = true; // don't call getHelpQueue periodically

    // always use a localhost server for recording so that we don't
    // pollute the real server logs
    TogetherJS._defaultConfiguration.hubBase = 'http://localhost:30035/';

    var recordReplayDiv = `
      <button id="recordBtn" type="button" class="togetherjsBtn" style="font-size: 9pt;">
      Record demo
      </button>

      <br/>
      <button id="playbackBtn" type="button" class="togetherjsBtn" style="font-size: 9pt;">
      Play recording
      </button>`;
    $("td#headerTdLeft").html(recordReplayDiv); // clobber the existing contents

    $("#recordBtn").click(this.recordButtonClicked.bind(this));
    $("#playbackBtn").click(this.startPlayback.bind(this));


    // TODO: move up to opt-shared-sessions.ts when you're ready
    this.pyInputAceEditor.selection.on("changeCursor", this.cursorOrSelectionChanged.bind(this));
    this.pyInputAceEditor.selection.on("changeSelection", this.cursorOrSelectionChanged.bind(this));


    // BEGIN - lifted from Recordmp3js
    var audio_context;

    try {
      // webkit shim
      (window as any).AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      (navigator as any).getUserMedia = ( (navigator as any).getUserMedia ||
                       (navigator as any).webkitGetUserMedia ||
                       (navigator as any).mozGetUserMedia ||
                       (navigator as any).msGetUserMedia);
      (window as any).URL = (window as any).URL || (window as any).webkitURL;

      audio_context = new AudioContext;
      console.warn('Audio context set up.');
      //console.warn('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
      alert('ERROR: no web audio support in this browser!');
    }

    (navigator as any).getUserMedia({audio: true},
      // success:
      (stream) => {
        this.audioInputStream = audio_context.createMediaStreamSource(stream);
        console.warn('Media stream created.' );
        console.warn("input sample rate " + this.audioInputStream.context.sampleRate);
        console.warn('Input connected to audio context destination.');

        this.audioRecorder = new Recorder(this.audioInputStream, {
          numChannels: 1,
          doneEncodingMp3Callback: this.doneEncodingMp3.bind(this),
        });
      },
      // failure:
      (e) => {
          alert('ERROR: No live audio input: ' + e);
      }
    );
    // END - lifted from Recordmp3js
  }

  // lifted from Recordmp3js
  startRecordingAudio() {
    assert(this.audioRecorder);
    assert(this.demoVideo);
    this.demoVideo.mp3AudioRecording = null; // erase any existing audio data
    this.audioRecorder.record();
  }

  stopRecordingAudio() {
    assert(this.audioRecorder);
    this.audioRecorder.stop();

    this.audioRecorder.exportWAV(function(blob) {
      console.log('calling audioRecorder.exportWAV');
    });

    this.audioRecorder.clear();
  }

  doneEncodingMp3(mp3Data) {
    console.log('doneEncodingMp3!');
    assert(this.demoVideo);
    var dataUrl = 'data:audio/mp3;base64,'+encode64(mp3Data);
    this.demoVideo.mp3AudioRecording = dataUrl;

    //(localStorage as any).demoVideo = this.demoVideo.serializeToJSON(); // serialize 'this' after audio is ready

    // create a download link
    let hf = document.createElement('a');
    // serialize 'this' into a JSON string and turn it into a data URL:
    hf.href = URL.createObjectURL(new Blob([this.demoVideo.serializeToJSON()], {type : 'application/json'}));
    // set download filename based on timestamp:
    (hf as any).download = 'codcast_' + (new Date().toISOString()) + '.json';
    hf.innerHTML = 'Download recording';
    (document.getElementById('headerTdLeft') as any).append(hf);
    // disable auto-download, since it's kind of annoying and hidden
    //hf.click(); // automatically click to download the recording as a file
  }

  // TODO: move up to opt-shared-sessions.ts when you're ready
  cursorOrSelectionChanged(e) {
    if (TogetherJS.running && !this.isPlayingDemo) {
      if (e.type === 'changeCursor') {
        let c = this.pyInputAceEditor.selection.getCursor();
        //console.log('changeCursor', c);
        TogetherJS.send({type: "aceChangeCursor",
                         row: c.row, column: c.column});
      } else if (e.type === 'changeSelection') {
        let s = this.pyInputAceEditor.selection.getRange();
        //console.log('changeSelection', s);
        TogetherJS.send({type: "aceChangeSelection",
                         start: s.start, end: s.end});
      } else {
        // fail soft
        console.warn('cursorOrSelectionChanged weird type', e.type);
      }
    }
  }

  // override from superclasses to be NOPs to cancel default superclass behavior
  takeFullCodeSnapshot() {return;}

  recordButtonClicked() {
    if ($("#recordBtn").data('status') === 'recording') {
      // issue this event right before stopping the recording
      // (if you do this after calling TogetherJS(), then the event
      // won't be properly logged)
      TogetherJS.send({type: "stopRecordingDemo"});

      TogetherJS(); // this will stop recording
      $("#recordBtn").data('status', 'stopped');
      $("#recordBtn").html("Record demo");
    } else {
      $("#ssDiv,#surveyHeader").hide(); // hide ASAP!
      $("#togetherjsStatus").html("Recording now ...");

      this.demoVideo = new OptDemoVideo(this);
      this.demoVideo.startRecording();

      $("#recordBtn").data('status', 'recording');
      $("#recordBtn").html("Stop recording");
    }
  }

  finishSuccessfulExecution() {
    assert (this.myVisualizer);

    if (this.isRecordingDemo) {
      this.traceCacheAdd(); // add to cache only if we're recording a demo
    }

    // do this last
    super.finishSuccessfulExecution();
  }

  handleUncaughtException(trace: any[]) {
    super.handleUncaughtException(trace); // do this first

    // do this even if execution fails
    if (this.isRecordingDemo) {
      this.traceCacheAdd(); // add to cache only if we're recording a demo
    }
  }

  TogetherjsReadyHandler() {
    if (this.isRecordingDemo) {
      assert (this.demoVideo);
      this.demoVideo.recordTogetherJsReady();

      // start recording audio only after TogetherJS is ready and
      // eventRecorderFunc has been set so that it can log the event:
      this.startRecordingAudio();
      TogetherJS.send({type: "startRecordingDemo"}); // special start marker, to coincide with when audio starts recording
    } else if (this.isPlayingDemo) {
      super.TogetherjsReadyHandler(); // delegate to superclass
    } else {
      assert(false);
    }
  }

  TogetherjsCloseHandler() {
    super.TogetherjsCloseHandler();

    // reset all recording-related stuff too!
    if (this.isRecordingDemo) {
      this.stopRecordingAudio(); // it will still take some time before the encoded mp3 data is ready and doneEncodingMp3 is called!
      assert (this.demoVideo);
      this.demoVideo.stopRecording();
      assert(!this.isRecordingDemo);
    } else {
      assert(this.isPlayingDemo); // the 'super' call above should've already handled this case
    }
  }
} // END Class OptDemoRecorder


$(document).ready(function() {
  // initialize all HTML elements before creating optFrontend object
  $("#footer").append(footerHtml);

  var params = {};
  var optFrontend = new OptDemoRecorder(params);

  $('#pythonVersionSelector').change(optFrontend.setAceMode.bind(optFrontend));
  optFrontend.setAceMode();
});
