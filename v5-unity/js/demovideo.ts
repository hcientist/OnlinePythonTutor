import {TogetherJS} from './opt-shared-sessions';
import {assert} from './pytutor';

// represents a list of TogetherJS events that can be replayed, paused, etc.
// within the context of the current app, along with audio
export class OptDemoVideo {
  frontend;

  initialAppState; // from getAppState()
  events = [];
  traceCache;
  isFrozen = false; // set to true after you finish recording to 'freeze'
                    // this tape and not allow any further modifications

  origIgnoreForms;  // for interfacing with TogetherJS
  fps = 30; // frames per second for setInterval-based playback

  currentFrame = 0; // for play/pause
  currentStep = 0;  // a 'step' is an index into events, whereas a 'frame' is an animation frame
  isPaused = false;  // is playback currently paused?
  rafTimerId = undefined;

  mp3AudioRecording = null; // a data URL representing the contents of the mp3 audio (if available)
  audioElt = null; // HTML5 Audio() object

  sess; // the current live TogetherJS session object

  constructor(frontend, serializedJsonStr=null) {
    this.frontend = frontend;

    // initialize from an existing JSON string created with serializeToJSON()
    if (serializedJsonStr) {
      var obj = JSON.parse(serializedJsonStr);

      this.initialAppState = obj.initialAppState;
      this.events = obj.events;
      this.traceCache = obj.traceCache;
      this.mp3AudioRecording = obj.mp3AudioRecording;

      // VERY IMPORTANT -- set the traceCache entry of the frontend so
      // that it can actually be used. #tricky!
      // TODO: this is kind of a gross abstraction violation, eergh
      this.frontend.traceCache = this.traceCache;

      this.isFrozen = true; // freeze it!
      this.addFrameNumbers();
    }
  }

  // only record certain kinds of events in the recorder
  // see ../../v3/opt_togetherjs/server.js around line 460 for all
  static shouldRecordEvent(e) {
    // do NOT record cursor-click since that's too much noise
    return ((e.type == 'form-update') ||
            (e.type == 'cursor-update') ||
            (e.type == 'app.executeCode') ||
            (e.type == 'app.updateOutput') ||
            (e.type == 'app.startRecordingDemo') ||
            (e.type == 'app.stopRecordingDemo') ||
            (e.type == 'app.aceChangeCursor') ||
            (e.type == 'app.aceChangeSelection') ||
            (e.type == 'pyCodeOutputDivScroll') ||
            (e.type == 'app.hashchange'));
  }

  addEvent(msg) {
    assert(!this.isFrozen);
    msg.ts = new Date().getTime(); // augment with timestamp
    msg.peer = {color: "#8d549f"}; // fake just enough of a peer object for downstream functions to work
    msg.sameUrl = true;
    if (OptDemoVideo.shouldRecordEvent(msg)) {
      this.events.push(msg);
    }
  }

  // do this BEFORE TogetherJS gets initialized
  startRecording() {
    assert(!this.isFrozen);
    assert(!TogetherJS.running);
    this.frontend.traceCacheClear();
    this.initialAppState = this.frontend.getAppState();
    // cache the current trace if we're in display mode
    if (this.initialAppState.mode == "display") {
      this.frontend.traceCacheAdd();
    }

    this.frontend.isRecordingDemo = true;
    TogetherJS.config('isDemoSession', true);
    TogetherJS(); // activate TogetherJS as the last step to start the recording
  }

  // this is run as soon as TogetherJS is ready in recording mode
  recordTogetherJsReady() {
    assert(TogetherJS.running && this.frontend.isRecordingDemo && !this.frontend.isPlayingDemo);

    // set the TogetherJS eventRecorderFunc to this.demoVideo.addEvent
    // (don't forget to bind it as 'this', ergh!)
    TogetherJS.config('eventRecorderFunc', this.addEvent.bind(this));
  }

  stopRecording() {
    assert(!this.isFrozen);
    this.traceCache = this.frontend.traceCache;
    this.isFrozen = true; // freeze it!
    this.addFrameNumbers();

    this.frontend.isRecordingDemo = false;
    TogetherJS.config('isDemoSession', false);
    TogetherJS.config('eventRecorderFunc', null);
  }

  setInitialAppState() {
    assert(this.initialAppState);
    this.frontend.pyInputSetValue(this.initialAppState.code);
    this.frontend.setToggleOptions(this.initialAppState);

    if (this.initialAppState.mode == 'display') {
      // we *should* get a cache hit in traceCache so this won't go to the server
      this.frontend.executeCode(this.initialAppState.curInstr);
    } else {
      assert(this.initialAppState.mode == 'edit');
      this.frontend.enterEditMode();
    }

    this.currentFrame = 0;
    this.currentStep = 0;

    // OK this is super subtle but important. you want to call setInit
    // defined deep in the bowels of lib/togetherjs/togetherjs/togetherjsPackage.js
    // why are we calling it right now? because we need to clear the
    // edit history that TogetherJS captures to start us over with a
    // clean slate so that we can start replaying events from the start
    // of the trace. otherwise form-update events in the Ace editor
    // won't work. we need setInit since it's *synchronous* and executes
    // instantly rather than waiting on an async event queue.
    var setInit = TogetherJS.config.get('setInit');
    setInit();
  }

  startPlayback() {
    assert(this.isFrozen);
    assert(!TogetherJS.running); // do this before TogetherJS is initialized
    assert(this.mp3AudioRecording); // audio must be initialized before you start playing

    // save the original value of ignoreForms
    this.origIgnoreForms = TogetherJS.config.get('ignoreForms');
    // set this to true, which will have TogetherJS ignore ALL FORM
    // EVENTS, which means that it will ignore events fired on the Ace
    // editor (which are form-update events or somethin') ... if we
    // don't do that, then spurious events will get fired durin playback
    // and weird stuff will happen
    TogetherJS.config('ignoreForms', true);

    this.frontend.isPlayingDemo = true;
    TogetherJS.config('isDemoSession', true);
    TogetherJS(); // activate TogetherJS as the last step to start playback mode
  }

  // set a timer to play in real time starting at this.currentFrame
  playFromCurrentFrame() {
    assert(TogetherJS.running && this.frontend.isPlayingDemo);
    var totalFrames = this.getTotalNumFrames();
    // if we're at the VERY end, then loop back to the very beginning
    if (this.currentFrame >= totalFrames) {
      this.setInitialAppState();
    }

    var startingFrame = this.currentFrame;

    // play the first N steps to get up to right before this.currentFrame
    // TODO: it's kinda klunky to convert "video" frames to steps, which
    // which are actually indices into this.events
    if (startingFrame > 0) {
      var step = this.frameToStepNumber(startingFrame);
      this.playFirstNSteps(step);
    }


    // handle audio
    assert(this.mp3AudioRecording);

    // always create a new element each time to avoid stale old ones
    // being stuck at weird seek positions
    this.audioElt = new Audio();
    this.audioElt.src = this.mp3AudioRecording;
    this.audioElt.currentTime = this.frameToSeconds(startingFrame);
    this.audioElt.play();
    console.log('playFromCurrentFrame', startingFrame, 'totalFrames', totalFrames, 'currentTime:', this.audioElt.currentTime, this.audioElt.ended);

    var starttime = -1;
    var rafHelper = (timestamp) => {
      assert(this.audioElt); // we will always synchronize with the audio, so if you don't have audio, it's a dealbreaker
      if (this.isPaused) {
        return;
      }

      // keep going until your audio dies:
      if (!this.audioElt.ended) {
        this.rafTimerId = requestAnimationFrame(rafHelper);

        // always use the latest values of this.audioElt.currentTime to
        // calculate the current frame so that we can try to keep the
        // audio and animation in sync as much as possible:
        let frameNum = this.secondsToFrames(this.audioElt.currentTime);
        this.currentFrame = frameNum;

        //console.log('audioElt.currentTime:', this.audioElt.currentTime, frameNum, totalFrames, this.audioElt.ended);

        // TODO: this is an abstraction violation since OptDemoVideo
        // shouldn't know about #timeSlider, which is part of the GUI!
        // (maybe tunnel this through a callback?)
        $("#timeSlider").slider("value", frameNum); // triggers slider 'change' event
      } else {
        // set currentFrame and slider to the very end for consistency
        this.currentFrame = totalFrames;
        $("#timeSlider").slider("value", totalFrames);

        this.frontend.setPlayPauseButton('paused');
      }
    }

    // kick it off!
    this.isPaused = false; // unpause me!
    this.rafTimerId = requestAnimationFrame((timestamp) => {
      starttime = timestamp;
      rafHelper(timestamp);
    });

    this.frontend.pyInputAceEditor.setReadOnly(true); // don't let the user edit code when demo is playing
  }

  pause() {
    assert(TogetherJS.running && this.frontend.isPlayingDemo);
    this.isPaused = true;
    console.log('pause: currentFrame:', this.currentFrame);
    if (this.rafTimerId) {
      cancelAnimationFrame(this.rafTimerId);
      this.rafTimerId = undefined;
    }

    if (this.audioElt) {
      this.audioElt.pause();
      // kill it and start afresh each time to (hopefully) avoid out of sync issues
      this.audioElt.src = '';
      this.audioElt = null;
    }
    this.frontend.pyInputAceEditor.setReadOnly(false); // let the user edit code when paused
  }

  // this is run as soon as TogetherJS is ready in playback mode
  playbackTogetherJsReady() {
    assert(TogetherJS.running && this.frontend.isPlayingDemo && !this.frontend.isRecordingDemo);

    // initialize the session here
    this.sess = TogetherJS.require("session");

    // STENT for debugging only
    (window as any).demoVideo = this;

    this.setInitialAppState(); // reset app state to the initial one
  }

  playEvent(msg) {
    assert(this.sess && this.frontend.isPlayingDemo);
    //this.frontend.pyInputAceEditor.resize(true);

    // seems weird but we need both session.hub.emit() and
    // TogetherJS._onmessage() in order to gracefully handle
    // both built-in TogetherJS events and custom OPT app events:
    // copied-pasted from lib/togetherjs/togetherjs/togetherjsPackage.js
    // around line 1870
    try {
      this.sess.hub.emit(msg.type, msg);
    } catch (e) {
      console.warn(e);
      // let it go! let it go!
    }

    try {
      TogetherJS._onmessage(msg);
    } catch (e) {
      console.warn(e);
      // let it go! let it go!
    }

    // however, TogetherJS._onmessage mangles up the type fields
    // (UGH!), so we need to restore them back to their original
    // form to ensure idempotence. copied from session.appSend()
    var type = msg.type;
    if (type.search(/^togetherjs\./) === 0) {
      type = type.substr("togetherjs.".length);
    } else if (type.search(/^app\./) === -1) {
      type = "app." + type;
    }
    msg.type = type;
  }

  playStep(i: number) {
    assert(i >= 0 && i < this.events.length);
    this.playEvent(this.events[i]);
    this.currentStep = i; // very important!!!
  }

  // play all steps from [lower, upper], inclusive
  playStepRange(lower: number, upper: number) {
    //console.log('playStepRange', lower, upper, 'curStep:', this.currentStep);
    assert(lower <= upper);
    for (var i = lower; i <= upper; i++) {
      this.playStep(i);
    }
  }

  // this method *instantaneously* plays all steps from 0 to n
  // (so everything it calls should work SYNCHRONOUSLY ...
  //  if there's async code in its callee chain, something will probably break)
  playFirstNSteps(n: number) {
    //console.log('playFirstNSteps', n, 'curStep', this.currentStep, 'curFrame', this.currentFrame);
    assert(this.isFrozen);
    assert(TogetherJS.running && this.frontend.isPlayingDemo);
    assert(n >= 0 && n < this.events.length);
    this.setInitialAppState(); // reset app state to the initial one

    // go up to n, inclusive!
    for (var i = 0; i <= n; i++) {
      this.playStep(i);
    }
  }

  // given a frame number, convert it to the step number (i.e., index in
  // this.events) that takes place right BEFORE that given frame.
  frameToStepNumber(n) {
    assert(this.isFrozen && this.events[0].frameNum);
    var foundIndex = -1;
    for (var i = 0; i < this.events.length; i++) {
      if (n < this.events[i].frameNum) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex < 0) {
      return this.events.length - 1;
    } else if (foundIndex == 0) {
      return 0; // TODO: kinda weird that we return 0 for foundIndex being 0 or 1
    } else {
      return foundIndex - 1; // subtract 1 to get the step right BEFORE the found one
    }
  }

  jumpToFrame(frame) {
    assert(this.currentStep >= 0);
    var step = this.frameToStepNumber(frame);

    // avoid unnecessary calls
    if (step == this.currentStep) {
      // do nothing! pass thru
    } else if (step > this.currentStep) {
      // as an optimization, simply play ahead from the current step
      // rather than playing all steps from 0 to step again from scratch
      this.playStepRange(this.currentStep + 1, step);
    } else {
      // if we're stepping backwards, then we have no choice but to
      // play everything from scratch because we can't "undo" actions
      assert(step >= 0 && step < this.currentStep);
      this.playFirstNSteps(step);
    }
    this.currentFrame = frame; // do this at the VERY END after all the dust clears
  }


  stopPlayback() {
    this.sess = null;
    this.frontend.isPlayingDemo = false;
    TogetherJS.config('ignoreForms', this.origIgnoreForms); // restore its original value
    TogetherJS.config('isDemoSession', false);
    TogetherJS.config('eventRecorderFunc', null);
  }

  // serialize the current state to JSON:
  serializeToJSON() {
    assert(this.isFrozen);

    var ret = {initialAppState: this.initialAppState,
               events: this.events,
               traceCache: this.traceCache,
               mp3AudioRecording: this.mp3AudioRecording};
    return JSON.stringify(ret);
  }

  getFrameDiff(a, b) {
    assert(a <= b);
    return Math.floor(((b - a) / 1000) * this.fps);
  }

  // add a frameNum field for each entry in this.events
  addFrameNumbers() {
    assert(this.isFrozen && this.events.length > 0);
    var firstTs = this.events[0].ts;
    for (var i = 0; i < this.events.length; i++) {
      var elt = this.events[i];
      // add 1 so that the first frameNum starts at 1 instead of 0
      elt.frameNum = this.getFrameDiff(firstTs, elt.ts) + 1;
    }
  }

  // how many frames should there be in the animation?
  getTotalNumFrames() {
    assert(this.isFrozen && this.events.length > 0);

    var firstTs = this.events[0].ts;
    var lastTs = this.events[this.events.length-1].ts;

    return this.getFrameDiff(firstTs, lastTs);

    // add 1 at the end for extra padding
    // NIX THIS!!!
    //return this.getFrameDiff(firstTs, lastTs) + 1;
  }

  secondsToFrames(secs) {
    return Math.floor(secs * this.fps);
  }

  frameToSeconds(frame) {
    return frame / this.fps;
  }
}
