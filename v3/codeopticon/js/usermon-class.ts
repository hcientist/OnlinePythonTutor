/* TODOs:

- maybe start calculating diffs from the most recent point where there's
  a complete piece of code rather than from the very beginning of the
  trace, so as to be more robust?!?

- why are there sometimes learners with NO EVENTS being rendered? did
  they just connect and not issue any additional events?

- the language selector doesn't get updated right away; only when
  something gets executed, etc.

- when visualizing, return lines don't show up properly, and prevline
  (green) covers up curline (red)

*/

declare var diff_match_patch : any; // dummy to shut up compiler

function insertNoDup(arr, e) {
  if (arr.indexOf(e) < 0) {
    arr.push(e);
  }
}

// same as htmlspecialchars except don't worry about expanding spaces or
// tabs since we want proper word wrapping in divs.
function htmlsanitize(str) {
  if (typeof(str) == "string") {
    str = str.replace(/&/g, "&amp;"); /* must do &amp; first */

    str = str.replace(/</g, "&lt;");
    str = str.replace(/>/g, "&gt;");
  }
  return str;
}


var AceRange = ace.require("ace/range").Range;
//var AceSelection = ace.require("ace/selection").Selection;
var AceDocument = ace.require("ace/document").Document;
var dmp = new diff_match_patch(); // TODO: is it OK for this to be a global?

function isEditCodeEvent(evt) {
  return (evt.eventType === 'opt-client-event' &&
          evt.data.type === 'editCode');
}

// User monitor
class UserMon {
  events: any[] = []; // a list of filtered user events in codeopticon format
                      // ONLY opt-client-event events will be added!!!
  idx = 0; // current index of display, refers to events array

  curAceMode: string = 'python'; // default

  initialCod: string = undefined;

  editor;
  session;
  renderedDocument;
  trueInternalDocument;

  gutterDecorations = [];

  stepperGutterDecorations = []; // for rendering updateOutput calls

  animationTimerId: number;
  loopTimerId: number;
  loopStartIdx: number;
  loopEndIdx: number;
  loopGutterDecorations = [];

  domRoot: JQuery;
  sliderDiv: JQuery;

  uniqueID: number;

  constructor(domRoot, uniqueID, myWidth='500px', myHeight='300px') {
    this.uniqueID = uniqueID;

    var editorDivName = 'editor' + String(uniqueID);

    var userMonHTML = '\
    <div class="usermon">\
      <div class="header">\
        <span class="mode"></span>\
        <span class="inputLst"></span>\
        <span class="lang"></span>\
      </div>\
      <div id="' + editorDivName + '" class="aceEditor"></div>\
      <div class="slider"></div>\
      <div class="footer" style="margin-top: 5px;"></div>\
    </div>';

    this.domRoot = domRoot;

    // try to clear first to (maybe) prevent memory leak:
    this.domRoot.empty().html(userMonHTML);

    // set these BEFORE calling ace.edit()
    this.domRoot.find('.aceEditor')
      .css('width', myWidth)
      .css('height', myHeight);

    // Ace's containment relationship: Editor -> EditSession -> Document
    this.editor = ace.edit(editorDivName);
    this.session = this.editor.getSession();
    this.renderedDocument = this.session.getDocument();
    // contains the true contents, without any fanciness for rendering
    this.trueInternalDocument = new AceDocument('');

    this.editor.setReadOnly(true);
    this.editor.setHighlightActiveLine(false); // to avoid gray highlight over active line
    this.editor.setHighlightGutterLine(false); // to avoid gray highlight over gutter of active line
    this.editor.setDisplayIndentGuides(false); // to avoid annoying gray vertical lines
    this.editor.setFontSize(11);
    this.editor.$blockScrolling = Infinity; // kludgy to shut up weird warnings

    this.session.setMode("ace/mode/" + this.curAceMode);

    // initialize the slider
    this.sliderDiv = this.domRoot.find('.slider');

    // set widths ...
    this.domRoot.find('.header').css('width', myWidth);
    this.sliderDiv.width(myWidth);

    this.sliderDiv.slider({min: 0, max: 1, step: 1});
    //disable keyboard actions on the slider itself (to prevent double-firing of events)
    this.sliderDiv.find(".ui-slider-handle")
      .unbind('keydown')
      .css('width', '0.7em')
      .css('height', '1.4em');
    $(".ui-widget-content").css('font-size', '0.8em');

    this.sliderDiv.on('slide', (evt, ui) => {
      // this is SUPER subtle. if this value was changed programmatically,
      // then evt.originalEvent will be undefined. however, if this value
      // was changed by a user-initiated event, then this code should be
      // executed ...
      if (evt.originalEvent) {
        this.jumpToStep(ui.value);
      }
    });
  }

  getEditCodeIndices() {
    // indices in events where editCode events occurred
    var editCodeIndices: number[] = [];
    this.events.forEach((e, i) => {
      if (isEditCodeEvent(e)) {
        editCodeIndices.push(i);
      }
    });
    return editCodeIndices;
  }

  _addEventInternal(obj) {
    if (obj.eventType === 'opt-client-event') {
      if (obj.data.type === 'updateAppDisplay' || obj.data.type === 'doneExecutingCode') {
        // initialize this ASAP!
        if (this.initialCod === undefined) {
          this.initialCod = obj.data.appState.code;

          //this.editor.setValue(this.initialCod); // redundant with initDocuments
          this.initDocuments(this.initialCod);
          this.editor.clearSelection(); // or else we get a weird selection
        }
        // don't push updateAppDisplay to 'display' mode since that
        // signal is often redundant and uninformative (usually subsumed
        // by doneExecutingCode, and subsequent updateOutput events)
        if (!(obj.data.type === 'updateAppDisplay' && obj.data.mode === 'display')) {
          this.events.push(obj);
        }
      } else if (obj.data.type === 'editCode') {
        // only start picking up edit code events AFTER initialCod has
        // been hooked; otherwise we can't reconstruct the code from
        // incomplete deltas :(
        if (this.initialCod !== undefined) {
          this.events.push(obj);
        }
      } else if (obj.data.type === 'updateOutput') {
        this.events.push(obj);
      } else if (obj.data.type === 'opt-client-chat') {
        // IGNORE these events!
      } else {
        console.assert(false);
      }

    } else {
      // nix this ... ONLY ADD opt-client-events to the list
      /*
      console.assert(obj.eventType === 'opt-client-connect' ||
                     obj.eventType === 'opt-client-disconnect');
      this.events.push(obj);
      */
    }
  }

  _eventsLstSanityChecks() {
    // sanity checks
    if (this.events.length > 0) {
      // first event should NOT be editCode since we can't reconstruct the
      // original code from the incomplete delta without initialCod
      // (nix this since things might be reordered for chronological ordering)
      //console.assert(!isEditCodeEvent(this.events[0]));

      // everything should be in chronological order
      for (var i = 0; i < this.events.length - 1; i++) {
        var cur = this.events[i];
        var next = this.events[i+1];
        console.assert(cur.data.clientTime < next.data.clientTime);
      }
    }

    // indices in events where editCode events occurred
    var editCodeIndices = this.getEditCodeIndices();

    var prevIdx = undefined;
    editCodeIndices.forEach((idx) => {
      console.assert(isEditCodeEvent(this.events[idx]));
      if (prevIdx !== undefined) {
        console.assert(prevIdx < idx);
      }
      prevIdx = idx;
    });
  }

  // TODO: this is kinda inefficient since it loops over everything in
  // this.events, but it's easier to get right than an incremental approach:
  _populateDiffObjs() {
    // add a diffObj field to every editCode event by applying each
    // delta over all prior ones (tricky tricky)
    var deltas = [];
    var cur = this.initialCod;
    //console.log('cur', cur);

    $.each(this.events, (i, obj) => {
      if (isEditCodeEvent(obj)) {
        // assert chronological order
        if (deltas.length) {
          console.assert(_.last(deltas).t <= obj.data.delta.t);
        }
        var curDelta = obj.data.delta.d;
        //console.log('curDelta', curDelta);

        // make this failure oblivious ... only initialize diffObj if
        // the diff properly goes through ... otherwise skip it and just
        // try again using the next diff. might be a dumb idea, but
        // let's try it for now :0
        try {
          var diff = dmp.diff_fromDelta(cur, curDelta); // might CROAK if cur and curDelta don't match up!
          obj.data.diffObj = diff; // add new field! (or replace existing one, i guess)

          var patch = dmp.patch_make(diff);
          var newCur = dmp.patch_apply(patch, cur);
          console.assert(newCur.length === 2);
          cur = newCur[0];

          deltas.push(obj.data.delta);
        } catch (e) {
          //console.warn(e); // RE-ENABLE sometime -- could be important
        }
      }
    });
  }

  // MODIFY UserMon by pushing a new event to it
  //
  // TODO: look into forcing chronological order of events based on
  // clientTime (if available)
  addEvent(obj /* event object in codeopticon format */) {
    this._addEventInternal(obj);

    // SORT this.events by clientTime to keep everything in chronological order!
    this.events.sort(function(a, b) {return a.data.clientTime - b.data.clientTime;});

    this._eventsLstSanityChecks();

    // TODO: this is kinda inefficient since it loops over everything in
    // this.events, but it's easier to get right than an incremental approach:
    if (this.initialCod !== undefined // tricky!!! initialCod can be '' but defined
        && isEditCodeEvent(obj)) {
      this._populateDiffObjs();
    }

    // expand the slider's width
    this.sliderDiv
        .slider() // add in an extra call to prevent weird "jquery-1.8.2.min.js:2 Uncaught Error: cannot call methods on slider prior to initialization" errors, but is that right?!?
        .slider('option', 'max', this.events.length - 1)
        .slider('value', this.idx); // move it back to its original value

    // only jump to end if you're currently at the penultimate entry --
    // otherwise just stay at the original value
    if (this.idx === this.events.length - 2) {
      this.jumpToEnd();
    }
  }

  addEventsLst(events: any[]) {
    events.forEach((e, i) => {
      this._addEventInternal(e);
    });

    // SORT this.events by clientTime to keep everything in chronological order!
    this.events.sort(function(a, b) {return a.data.clientTime - b.data.clientTime;});

    this._eventsLstSanityChecks();

    /*
    this.events.forEach((e, i) => {
      console.log(e.data);
    });
    console.log('------');
    */

    this._populateDiffObjs();

    this.sliderDiv.slider('option', 'max', this.events.length - 1);
    this.jumpToEnd();
  }

  jumpToEnd() {
    // jump to the most recent event
    if (this.events.length > 0) {
      this.jumpToStep(this.events.length - 1);
      console.assert(this.events.length - 1 === this.idx);
      this.sliderDiv.slider('value', this.idx); // programmatically update the slider
    }
  }

  initDocuments(startingText) {
    this.renderedDocument.setValue(startingText); // initialize
    this.trueInternalDocument.setValue(startingText); // initialize
  }

  clearAllFrills() {
    // clear exceptions
    this.setException('');
    this.session.clearAnnotations()

    // clear all animations
    if (this.animationTimerId) {
      clearInterval(this.animationTimerId);
      this.animationTimerId = undefined;
    }

    // clear all gutters
    while (this.gutterDecorations.length > 0) {
      var gd = this.gutterDecorations.pop();
      this.session.removeGutterDecoration(gd[0], gd[1]);
    }

    // clear all stepper gutters
    while (this.stepperGutterDecorations.length > 0) {
      var gd = this.stepperGutterDecorations.pop();
      this.session.removeGutterDecoration(gd[0], gd[1]);
    }

    // clear all previously-set markers
    var backMarkers = this.session.getMarkers(false); // back
    var frontMarkers = this.session.getMarkers(true); // front
    $.each(backMarkers, (k, v) => {
      if (v.type === 'insertedText' || v.type === 'deletedText') {
        console.assert(Number(k) === Number(v.id));
        this.session.removeMarker(k);
      }
    });
    // TODO: copy-pasta
    $.each(frontMarkers, (k, v) => {
      if (v.type === 'insertedText' || v.type === 'deletedText') {
        console.assert(Number(k) === Number(v.id));
        this.session.removeMarker(k);
      }
    });
  }

  applyDiff(diff,
            color, /* should we try to color and animate relevant changes? */
            isReverse, /* should we reverse the effects of diff? */
            autoScroll /* should the viewport auto-scroll? */) {
    var isAllWhitespace;

    this.clearAllFrills();

    // color the gutters to make it easier to see at a glance which lines have changed
    // (VERY important to do this at the VERY BEGINNING before the editor gets modified)
    if (color) {
      var ar = this.getAffectedRows(diff);
      var bothInsertionAndDeletionRows = _.intersection(ar.rowsWithInsertions,
                                                        ar.rowsWithDeletions);

      // remove redundancies
      var allInsertionRows = _.difference(ar.rowsWithInsertions, bothInsertionAndDeletionRows);
      var allDeletionRows = _.difference(ar.rowsWithDeletions, bothInsertionAndDeletionRows);

      allInsertionRows.forEach((r, i) => {
        this.session.addGutterDecoration(r, 'greenGutter');
        this.gutterDecorations.push([r, 'greenGutter']);
      });
      allDeletionRows.forEach((r, i) => {
        this.session.addGutterDecoration(r, 'redGutter');
        this.gutterDecorations.push([r, 'redGutter']);
      });
      bothInsertionAndDeletionRows.forEach((r, i) => {
        this.session.addGutterDecoration(r, 'redGreenStripeGutter');
        this.gutterDecorations.push([r, 'redGreenStripeGutter']);
      });
    }


    // each diff consists of N chunks, starting edits at offset 0
    var offset = 0;

    // list of deletion events in this particular diff:
    var deletions = [];

    // see http://stackoverflow.com/questions/25083183/how-can-i-get-and-patch-diffs-in-ace-editor
    diff.forEach((chunk) => {
      var op = chunk[0];
      var text = chunk[1];

      if (op === 0) { // equality ... just advance forward
        offset += text.length;
      } else if (op === (isReverse ? 1 : -1)) { // -1 means delete

        // sync up the document's contents from trueInternalDocument before
        // making any further changes to it.
        // (TODO: is this the right place to put this sync function?)
        this.renderedDocument.setValue(this.trueInternalDocument.getValue());
        //console.log(String(this.idx), 'sync renderedDocument with trueInternalDocument');

        var startPos = this.renderedDocument.indexToPosition(offset);
        var endPos = this.renderedDocument.indexToPosition(offset + text.length);
        var deleteRange = AceRange.fromPoints(startPos, endPos);
        var txtToDelete = this.session.getTextRange(deleteRange);

        isAllWhitespace = (txtToDelete.trim() === '');

        this.renderedDocument.remove(deleteRange);
        this.trueInternalDocument.remove(deleteRange);

        deletions.push({deletedText: txtToDelete, deleteRange: deleteRange});

        // move the editor's cursor to offset to look aesthetically sharp
        this.editor.clearSelection(); // or else we get a weird selection
        this.editor.moveCursorToPosition(startPos);
        if (autoScroll) {
          this.editor.scrollToLine(startPos.row, true /* vertically center it */);
        }
      } else if (op === (isReverse ? -1 : 1)) { // 1 means insert

        // sync up the document's contents from trueInternalDocument before
        // making any further changes to it.
        // (TODO: is this the right place to put this sync function?)
        this.renderedDocument.setValue(this.trueInternalDocument.getValue());
        //console.log(String(this.idx), 'sync renderedDocument with trueInternalDocument');

        var startPos = this.renderedDocument.indexToPosition(offset);

        // make sure both are synced
        this.renderedDocument.insert(startPos, text);
        this.trueInternalDocument.insert(startPos, text);

        isAllWhitespace = (text.trim() === '');

        offset += text.length;
        var endPos = this.renderedDocument.indexToPosition(offset); // use the new offset value

        var insertRange = new AceRange(startPos.row, startPos.column,
                                       endPos.row, endPos.column);
        if (color) {
          // all whitespace AND spanning multiple lines ...
          if (isAllWhitespace && insertRange.isMultiLine()) {
            // render a gutter marker on all rows and also, for the
            // final row, highlight up until the cursor

            // nix this since it should already be covered by getAffectedRows
            /*
            for (var r = insertRange.start.row; r <= insertRange.end.row; r++) {
              this.session.addGutterDecoration(r, 'greenGutter');
              this.gutterDecorations.push([r, 'greenGutter']);
            }
            */

            // for the final row, highlight up until the cursor ...
            this.session.addMarker(new AceRange(insertRange.end.row, 0,
                                                insertRange.end.row, insertRange.end.column),
                                   'greenMarker', 'insertedText', false /* inFront */);
          } else {
            this.session.addMarker(insertRange,
                                   'greenMarker',
                                   'insertedText' /* for selecting later! */,
                                   false /* inFront -- definitely false! */);
          }
        }

        // move the editor's cursor to offset to look aesthetically sharp
        this.editor.clearSelection(); // or else we get a weird selection
        this.editor.moveCursorToPosition(endPos);
        if (autoScroll) {
          this.editor.scrollToLine(endPos.row, true /* vertically center it */);
        }
      } else {
        console.assert(false);
      }
    });


    // queue up all deletions objects to color them:
    if (color && deletions.length > 0) {
      var txtHidden = true;

      this.animationTimerId = setInterval(() => {
        $.each(deletions, (i, e) => {
          if (txtHidden) {
            this.renderedDocument.insert(e.deleteRange.start, e.deletedText);

            // all whitespace AND spanning multiple lines ...
            if (isAllWhitespace && e.deleteRange.isMultiLine()) {
              // render a gutter marker on all rows and also, for the
              // final row, highlight up until the cursor

              // nix this since it should already be covered by getAffectedRows
              /*
              for (var r = e.deleteRange.start.row; r <= e.deleteRange.end.row; r++) {
                this.session.addGutterDecoration(r, 'redGutter');
                this.gutterDecorations.push([r, 'redGutter']);
              }
              */

              // for the final row, highlight up until the cursor ...
              this.session.addMarker(new AceRange(e.deleteRange.end.row, 0,
                                                  e.deleteRange.end.row, e.deleteRange.end.column),
                                     'redMarker', 'deletedText', true);
            } else {
              this.session.addMarker(e.deleteRange,
                                     'redMarker',
                                     'deletedText',
                                     true);
            }
          } else {
            // remove all deletedText markers:
            var frontMarkers = this.session.getMarkers(true);
            $.each(frontMarkers, (k, v) => {
              if (v.type === 'deletedText') {
                console.assert(Number(k) === Number(v.id));
                this.session.removeMarker(k);
              }
            });

            this.renderedDocument.remove(e.deleteRange);
          }
        });
        txtHidden = !txtHidden;
      }, 750);
    }
  }

  reverseDiff(diff, color, autoScroll) {
    this.applyDiff(diff, color, true, autoScroll);
  }

  // TODO: is there a way to do a direct jump -- i.e., squishing a bunch
  // of diffs together -- rather than this hacky
  // multiple-single-step-jumps business? if we can compress a bunch of
  // diffs together into one, then that will make for a more meaningful
  // overall diff rather than a bunch of single diffs.
  jumpToStep(s, autoScroll=true, color=true /* render in color? */) {
    console.assert(0 <= s && s < this.events.length);

    // OK this is the super-simple algorithm -- just go from 0 until s
    // and apply all diffs from scratch. it's inefficient but reliable.

    // SUPER DUPER optimization: if there's no editCode event between
    // this.idx and s, then don't apply any deltas!!!
    var startIdx, endIdx;
    if (this.idx > s) {
      startIdx = s;
      endIdx = this.idx;
    } else {
      startIdx = this.idx;
      endIdx = s;
    }
    console.assert(startIdx <= endIdx);

    var editCodeIndices = this.getEditCodeIndices();

    var i;
    var needToApplyDiffs = true;
    for (i = 0; i < editCodeIndices.length - 1; i++) {
      var cur = editCodeIndices[i];
      var next = editCodeIndices[i+1];
      if (cur < startIdx && endIdx < next) { // fully open interval
        needToApplyDiffs = false;
      }
    }
    // edge case (literally!)
    var lastIdx = _.last(editCodeIndices);
    if (lastIdx < startIdx) {
      console.assert(lastIdx < endIdx);
      needToApplyDiffs = false;
    }

    // shit this is annoyingly tricky!!!
    var firstIdx = _.first(editCodeIndices);
    if (s < firstIdx) {
      // then let's CLEAR EVERYTHING since there are no diffs to apply!!!
      this.clearAllFrills();
      this.initDocuments(this.initialCod);
      this.editor.clearSelection(); // or else we get a weird selection
      needToApplyDiffs = false;
    }

    if (needToApplyDiffs) {
      // reset first ...
      this.initDocuments(this.initialCod);
      this.editor.clearSelection(); // or else we get a weird selection

      var lastDiffIdx = undefined;
      editCodeIndices.forEach((idx) => {
        if (idx <= s) {
          lastDiffIdx = idx;
        }
      });

      if (lastDiffIdx !== undefined) {
        console.assert(isEditCodeEvent(this.events[lastDiffIdx]));
      }

      //console.log(s, lastDiffIdx, editCodeIndices);

      // apply all steps from 0 to s, inclusive
      for (i = 0; i <= s; i++) {
        var curEvent = this.events[i];

        if (curEvent.eventType === 'opt-client-event') {
          if (isEditCodeEvent(curEvent)) {
            var curDiff = curEvent.data.diffObj;

            if (curDiff !== undefined) { // soften this constraint
              this.applyDiff(curDiff,
                             color ? (i === lastDiffIdx) : false,
                             false,
                             autoScroll);
            } else {
              //console.warn('this.events[' + String(i) + '] has no diff (uniqueID=' + String(this.uniqueID) + ')'); // RE-ENABLE sometime -- could be important
            }
          }
          // TODO: handle other cases
        }
      }
    } else {
      // !needToApplyDiffs
    }



    // now do a full-on sweep from 0 to s, inclusive, and update all
    // other status messages as necessary using the "most recent" value
    var lastLang = undefined;
    var lastInputJSON = undefined;
    var lastMode = undefined;
    var lastKillerException = undefined; // an Exception object
    var lastUpdateOutputObj = undefined;

    for (i = 0; i <= s; i++) {
      var evt = this.events[i];

      if (evt.eventType === 'opt-client-event') {
        var d = evt.data;
        var t = d.type;
        if (t === 'updateOutput') {
          lastUpdateOutputObj = d;
          lastMode = 'display';
        } else if (t === 'doneExecutingCode') {
          lastLang = d.appState.py;
          lastInputJSON = d.appState.rawInputLstJSON;
          lastKillerException = d.killerException; // an exception object
          lastMode = 'execute';
        } else if (t === 'updateAppDisplay') {
          // we're not tracking 'display' mode changes since that signal
          // is often redundant and uninformative (usually subsumed
          // by doneExecutingCode, and subsequent updateOutput events)
          console.assert(d.mode === 'edit');
          lastMode = 'edit';
          lastLang = d.appState.py;
          lastInputJSON = d.appState.rawInputLstJSON;

          lastUpdateOutputObj = undefined; // since we're editing code now, we're no longer displaying the results of updateOutput
        } else if (t === 'editCode') {
          lastMode = 'edit';
        }
      } else {
        //console.log(s, evt);
      }
    }
    this.setLang(lastLang);
    this.setVizMode(lastMode);
    this.setInputJSON(lastInputJSON);

    // careful! don't do both since the gutter errors might clobber one another
    if (lastMode === 'display') {
      this.renderUpdateOutputEvent(lastUpdateOutputObj);
    } else if (lastMode === 'edit') {
      // ugh, this is super ugly ...

      // clear exceptions
      this.setException('');
      this.session.clearAnnotations()

      // clear all stepper gutters
      while (this.stepperGutterDecorations.length > 0) {
        var gd = this.stepperGutterDecorations.pop();
        this.session.removeGutterDecoration(gd[0], gd[1]);
      }
    } else {
      console.assert(lastMode === 'execute');
      this.clearAllFrills(); // reset everything!
      if (lastKillerException) {
        this.handleKillerException(lastKillerException);
      }
    }


    this.idx = s; // finish!
  }

  // return an object containing lists of rows affected by the given diff
  getAffectedRows(diff) : {rowsWithInsertions: number[]; rowsWithDeletions: number[]} {
    var ret = {rowsWithInsertions: [], rowsWithDeletions: []};

    // each diff consists of N chunks, starting edits at offset 0
    var offset = 0;
    // see http://stackoverflow.com/questions/25083183/how-can-i-get-and-patch-diffs-in-ace-editor
    diff.forEach((chunk) => {
      var op = chunk[0];
      var text = chunk[1];

      var activeRange = undefined;
      var isInsertion = false;

      if (op === 0) { // equality ... just advance forward
        offset += text.length;
      } else if (op === -1) { // -1 means delete
        var startPos = this.renderedDocument.indexToPosition(offset);
        var endPos = this.renderedDocument.indexToPosition(offset + text.length);
        activeRange = AceRange.fromPoints(startPos, endPos);
      } else if (op === 1) { // 1 means insert
        var startPos = this.renderedDocument.indexToPosition(offset);
        offset += text.length;
        var endPos = this.renderedDocument.indexToPosition(offset); // use the new offset value
        activeRange = new AceRange.fromPoints(startPos, endPos);
        isInsertion = true;
      } else {
        console.assert(false);
      }

      if (activeRange !== undefined) {
        console.assert(activeRange.start.row <= activeRange.end.row);
        for (var i = activeRange.start.row; i <= activeRange.end.row; i++) {
          insertNoDup(isInsertion ? ret.rowsWithInsertions : ret.rowsWithDeletions, i);
        }
      }
    });

    return ret;
  }

  setLang(lang) {
    var langSpan = this.domRoot.find(".lang");

    var newMode;
    if (!lang) {
      langSpan.html('');
    } else if (lang === "2") {
      langSpan.html("Python 2");
      newMode = 'python';
    } else if (lang === "3") {
      langSpan.html("Python 3");
      newMode = 'python';
    } else if (lang === "java") {
      langSpan.html("Java");
      newMode = 'java';
    } else if (lang === "js") {
      langSpan.html("JavaScript");
      newMode = 'javascript';
    } else if (lang === "ts") {
      langSpan.html("TypeScript");
      newMode = 'typescript';
    } else if (lang === "c") {
      langSpan.html("C");
      newMode = 'c_cpp';
    } else if (lang === "cpp") {
      langSpan.html("C++");
      newMode = 'c_cpp';
    } else {
      console.assert(false);
    }

    if (newMode !== undefined && newMode !== this.curAceMode) {
      this.session.setMode("ace/mode/" + newMode);
      this.curAceMode = newMode;
    }
  }

  setVizMode(mode) {
    var modeSpan = this.domRoot.find(".mode");
    if (!mode) {
      modeSpan.html('');
    } else if (mode === 'edit') {
      modeSpan.html('Editing');
    } else if (mode === 'display') {
      modeSpan.html('Stepping');
    } else if (mode === 'execute') {
      modeSpan.html('Compiling');
    } else {
      console.assert(false);
    }
  }

  setInputJSON(s) {
    var rot = this.domRoot.find(".inputLst");
    if (s === undefined || s === "[]" /* empty list */) {
      rot.html('');
    } else {
      rot.html("Input: " + htmlsanitize(s));
    }
  }

  setException(s) {
    var exc = this.domRoot.find(".footer");
    if (!s) {
      exc.html('');
    } else {
      exc.html(htmlsanitize(s));
    }
  }

  renderUpdateOutputEvent(obj) {
    // always clear all stepper gutters
    while (this.stepperGutterDecorations.length > 0) {
      var gd = this.stepperGutterDecorations.pop();
      this.session.removeGutterDecoration(gd[0], gd[1]);
    }

    if (!obj) {
      return;
    }

    // and clear all diff displays as well ONLY if we actually want to render
    // something here ...
    this.clearAllFrills();

    if (obj.exception) {
      this.setException(obj.exception);
      if (obj.curline) {
        this.session.setAnnotations([{row: obj.curline - 1,
                                      type: 'error',
                                      text: obj.exception}]);
      }
    } else {
      this.setException('');
      this.session.clearAnnotations();
    }

    var r, p;

    // draw curline first since that apparently goes on top (?!?)
    // TODO: this doesn't seem to work, though :(
    if (obj.curline) {
      r = obj.curline - 1;
      console.assert(r >= 0);
      this.session.addGutterDecoration(r, 'curLineStepGutter');
      this.stepperGutterDecorations.push([r, 'curLineStepGutter']);
      this.editor.scrollToLine(r, true /* vertically center it */);
    }

    if (obj.prevline) {
      p = obj.prevline - 1;
      console.assert(p >= 0);
      this.session.addGutterDecoration(p, 'prevLineStepGutter');
      this.stepperGutterDecorations.push([p, 'prevLineStepGutter']);
      if (!r) {
        this.editor.scrollToLine(p, true /* vertically center it */);
      }
    }

  }

  handleKillerException(e) {
    if (!e) {
      this.setException('');
      this.session.clearAnnotations()
      return;
    }

    this.setException(e.exception_msg);

    var r = e.line - 1;
    if (r >= 0) { // there are weird cases of an exception on line 0, weird
      this.session.setAnnotations([{row: r,
                                    type: 'error',
                                    text: e.exception_msg}]);
      this.editor.scrollToLine(r, true /* vertically center it */);
    }
  }

  startLoop(startStep: number, endStep: number,
            msPerIteration: number,
            callback /* function that takes the current step as param after jump to step */) {
    console.assert(startStep <= endStep);
    if (startStep < 0) {
      startStep = 0;
    }

    this.loopStartIdx = startStep;
    this.loopEndIdx = endStep;

    var allInsertionRows = [];
    var allDeletionRows = [];
    for (var i = startStep; i < endStep; i++) {
      var ar = null //this.getAffectedRows(this.allDiffs[i]); // TODO: this is now busted
      allInsertionRows.push.apply(allInsertionRows, ar.rowsWithInsertions);
      allDeletionRows.push.apply(allDeletionRows, ar.rowsWithDeletions);
    }
    // dedup
    allInsertionRows = _.uniq(allInsertionRows);
    allDeletionRows = _.uniq(allDeletionRows);

    var bothInsertionAndDeletionRows = _.intersection(allInsertionRows, allDeletionRows);
    // remove redundancies
    allInsertionRows = _.difference(allInsertionRows, bothInsertionAndDeletionRows);
    allDeletionRows = _.difference(allDeletionRows, bothInsertionAndDeletionRows);

    console.log('startLoop', startStep, endStep,
                allInsertionRows, allDeletionRows, bothInsertionAndDeletionRows);

    allInsertionRows.forEach((r, i) => {
      this.session.addGutterDecoration(r, 'greenGutter');
      this.loopGutterDecorations.push([r, 'greenGutter']);
    });
    allDeletionRows.forEach((r, i) => {
      this.session.addGutterDecoration(r, 'redGutter');
      this.loopGutterDecorations.push([r, 'redGutter']);
    });
    bothInsertionAndDeletionRows.forEach((r, i) => {
      this.session.addGutterDecoration(r, 'redGreenStripeGutter');
      this.loopGutterDecorations.push([r, 'redGreenStripeGutter']);
    });

    var curStep = startStep;
    this.loopTimerId = setInterval(() => {
      this.jumpToStep(curStep,
                      false /* don't autoscroll in loop; it's disconcerting */,
                      (curStep !== startStep) /* don't color the FIRST STEP
                                                 since it's disconcerting;
                                                 the first step should be the
                                                 "baseline", thus uncolored */);
      callback(curStep);
      if (curStep === endStep) {
        curStep = startStep;
      } else {
        curStep++;
      }
    }, msPerIteration);
  }

  stopLoop() {
    console.assert(this.loopEndIdx !== undefined);
    clearInterval(this.loopTimerId);
    this.jumpToStep(this.loopEndIdx, true);

    // clear all gutters
    while (this.loopGutterDecorations.length > 0) {
      var gd = this.loopGutterDecorations.pop();
      this.session.removeGutterDecoration(gd[0], gd[1]);
    }
    console.assert(this.loopGutterDecorations.length === 0);

    // reset everything
    this.loopTimerId = undefined;
    this.loopStartIdx = undefined;
    this.loopEndIdx = undefined;
  }
}
