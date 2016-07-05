/// extracted from opt-frontend.js

var activateSyntaxErrorSurvey = false; // true;


// domID is the ID of the element to attach to (without the leading '#' sign)
function SyntaxErrorSurveyBubble(parentViz, domID) {
  this.parentViz = parentViz;

  this.domID = domID;
  this.hashID = '#' + domID;

  this.my = 'left center';
  this.at = 'right center';

  this.qtipHidden = false; // is there a qtip object present but hidden? (TODO: kinda confusing)
}

SyntaxErrorSurveyBubble.prototype.destroyQTip = function() {
  $(this.hashID).qtip('destroy');
}

SyntaxErrorSurveyBubble.prototype.redrawCodelineBubble = function() {
  var myVisualizer = optCommon.getVisualizer();
  if (myVisualizer.isOutputLineVisibleForBubbles(this.domID)) {
    if (this.qtipHidden) {
      $(this.hashID).qtip('show');
    }
    else {
      $(this.hashID).qtip('reposition');
    }

    this.qtipHidden = false;
  }
  else {
    $(this.hashID).qtip('hide');
    this.qtipHidden = true;
  }
}

SyntaxErrorSurveyBubble.prototype.qTipContentID = function() {
  return '#ui-tooltip-' + this.domID + '-content';
}

SyntaxErrorSurveyBubble.prototype.qTipID = function() {
  return '#ui-tooltip-' + this.domID;
}


// created on 2015-04-18
function experimentalPopUpSyntaxErrorSurvey() {
  if (prevExecutionExceptionObjLst.length > 0) {
    // work with the most recent entry
    var prevExecutionExceptionObj = prevExecutionExceptionObjLst[prevExecutionExceptionObjLst.length - 1];
    var offendingLine = prevExecutionExceptionObj.killerException.line;

    if (offendingLine === undefined) {
      return; // get out early!
    }

    // if we've switched languages between the previous error and this
    // run, then DON'T pop up a survey since the point is moot anyhow;
    // there's no point in asking the question when the language has
    // changed :)
    var curState = optCommon.getAppState();
    if (prevExecutionExceptionObj.myAppState.py != curState.py) {
      return;
    }

    // make sure jquery.qtip has been imported
    var myVisualizer = optCommon.getVisualizer();

    var codelineIDs = [];
    $.each(myVisualizer.domRoot.find('#pyCodeOutput .cod'), function(i, e) {
      // hacky!
      var domID = $(e).attr('id');
      var lineRE = new RegExp('cod' + String(offendingLine) + '$'); // $ for end-of-line match
      if (lineRE.test(domID)) {
        codelineIDs.push($(e).attr('id'));
      }
    });

    // should find only 1 match, or else something is wonky, maybe
    // because the code changed so much that the line number in question
    // is no longer available
    if (codelineIDs.length === 1) {
      var codLineId = codelineIDs[0];

      var bub = new SyntaxErrorSurveyBubble(myVisualizer, codLineId);

      // if pyCodeOutputDiv is narrower than the current line, then
      // adjust the x position of the pop-up bubble accordingly to be
      // flush with the right of pyCodeOutputDiv
      var pcodWidth = myVisualizer.domRoot.find('#pyCodeOutputDiv').width();
      var codLineWidth = myVisualizer.domRoot.find('#' + codLineId).parent().width(); // get enclosing 'tr'
      var adjustX = 0; // default

      // actually nix this for now to keep things simple ...
      //if (pcodWidth < codLineWidth) {
      //  adjustX = pcodWidth - codLineWidth; // should be negative!
      //}

      // destroy then create a new tip:
      bub.destroyQTip();
      $(bub.hashID).qtip($.extend({}, pytutor.qtipShared, {
        content: ' ', // can't be empty!
        id: bub.domID,
        position: {
          my: bub.my,
          at: bub.at,
          adjust: {
            x: adjustX,
          },
          effect: null, // disable all cutesy animations
        },
        style: {
          classes: 'ui-tooltip-pgbootstrap ui-tooltip-pgbootstrap-RED'
        }
      }));

      // need to set both max-width and width() ...
      $(bub.qTipID()).css('max-width', '350px').width('350px');

      var myUuid = optCommon.supports_html5_storage() ? localStorage.getItem('opt_uuid') : '';

      // Wording of the survey bubble:
      /*
      var version = 'v1'; // deployed on 2015-04-19, revoked on 2015-04-20
      var surveyBubbleHTML = '<div id="syntaxErrBubbleContents">\
                                <div id="syntaxErrHeader">You just fixed the following error:</div>\
                                <div id="syntaxErrCodeDisplay"></div>\
                                <div id="syntaxErrMsg"></div>\
                                <div id="syntaxErrQuestion">\
                                   If you think this message wasn\'t helpful, what would have been the best error message for you here?<br/>\
                                   <input type="text" id="syntaxErrTxtInput" size=60 maxlength=150/><br/>\
                                   <button id="syntaxErrSubmitBtn" type="button">Submit</button>\
                                   <button id="syntaxErrCloseBtn" type="button">Close</button>\
                                </div>\
                              </div>'
      */

      /*
      var version = 'v2'; // deployed on 2015-04-20, revoked on 2015-09-08
      var surveyBubbleHTML = '<div id="syntaxErrBubbleContents">\
                                <div id="syntaxErrHeader">You just fixed the following error:</div>\
                                <div id="syntaxErrCodeDisplay"></div>\
                                <div id="syntaxErrMsg"></div>\
                                <div id="syntaxErrQuestion">\
                                   If you think this message wasn\'t helpful, what would have been the best error message for you here?<br/>\
                                   <input type="text" id="syntaxErrTxtInput" size=60 maxlength=150/><br/>\
                                   <button id="syntaxErrSubmitBtn" type="button">Submit</button>\
                                   <button id="syntaxErrCloseBtn" type="button">Close</button>\
                                   <a href="#" id="syntaxErrHideAllLink">Hide all pop-ups</a>\
                                </div>\
                              </div>'
      */

      var version = 'v3'; // deployed on 2015-09-08
      var surveyBubbleHTML = '<div id="syntaxErrBubbleContents">\
                                <div id="syntaxErrHeader">You just fixed the following error:</div>\
                                <div id="syntaxErrCodeDisplay"></div>\
                                <div id="syntaxErrMsg"></div>\
                                <div id="syntaxErrQuestion">\
                                  Please help us improve error messages for future users.\
                                   If you think the above message wasn\'t helpful, what would have been the best message for you here?<br/>\
                                   <input type="text" id="syntaxErrTxtInput" size=60 maxlength=150/><br/>\
                                   <button id="syntaxErrSubmitBtn" type="button">Submit</button>\
                                   <button id="syntaxErrCloseBtn" type="button">Close</button>\
                                   <a href="#" id="syntaxErrHideAllLink">Hide all of these pop-ups</a>\
                                </div>\
                              </div>'


      $(bub.qTipContentID()).html(surveyBubbleHTML);

      // unbind first, then bind a new one
      myVisualizer.domRoot.find('#pyCodeOutputDiv')
        .unbind('scroll')
        .scroll(function() {
          bub.redrawCodelineBubble();
        });

      $(bub.qTipContentID() + ' #syntaxErrSubmitBtn').click(function() {
        var res = $(bub.qTipContentID() + ' #syntaxErrTxtInput').val();
        var resObj = {appState: optCommon.getAppState(),
                      exc: prevExecutionExceptionObj, // note that prevExecutionExceptionObjLst is BLOWN AWAY by now
                      opt_uuid: myUuid,
                      reply: res,
                      type: 'submit',
                      v: version};

        //console.log(resObj);
        $.get('syntax_err_survey.py', {arg: JSON.stringify(resObj)}, function(dat) {});

        bub.destroyQTip();
      });

      $(bub.qTipContentID() + ' #syntaxErrCloseBtn').click(function() {
        // grab the value anyways in case the learner wrote something decent ...
        var res = $(bub.qTipContentID() + ' #syntaxErrTxtInput').val();
        var resObj = {appState: optCommon.getAppState(),
                      exc: prevExecutionExceptionObj, // note that prevExecutionExceptionObjLst is BLOWN AWAY by now
                      opt_uuid: myUuid,
                      reply: res,
                      type: 'close',
                      v: version};

        //console.log(resObj);
        $.get('syntax_err_survey.py', {arg: JSON.stringify(resObj)}, function(dat) {});

        bub.destroyQTip();
      });

      $(bub.qTipContentID() + ' #syntaxErrHideAllLink').click(function() {
        // grab the value anyways in case the learner wrote something decent ...
        var res = $(bub.qTipContentID() + ' #syntaxErrTxtInput').val();
        var resObj = {appState: optCommon.getAppState(),
                      exc: prevExecutionExceptionObj, // note that prevExecutionExceptionObjLst is BLOWN AWAY by now
                      opt_uuid: myUuid,
                      reply: res,
                      type: 'killall',
                      v: version};

        activateSyntaxErrorSurvey = false; // global!

        //console.log(resObj);
        $.get('syntax_err_survey.py', {arg: JSON.stringify(resObj)}, function(dat) {});

        bub.destroyQTip();

        return false; // otherwise the 'a href' will trigger a page reload, ergh!
      });


      var bubbleAceEditor = ace.edit('syntaxErrCodeDisplay');
      // set the size and value ASAP to get alignment working well ...
      bubbleAceEditor.setOptions({minLines: 1, maxLines: 5}); // keep this SMALL
      bubbleAceEditor.setValue(prevExecutionExceptionObj.myAppState.code.rtrim() /* kill trailing spaces */,
                               -1 /* do NOT select after setting text */);

      var s = bubbleAceEditor.getSession();
      // tab -> 4 spaces
      s.setTabSize(4);
      s.setUseSoftTabs(true);
      // disable extraneous indicators:
      s.setFoldStyle('manual'); // no code folding indicators
      s.getDocument().setNewLineMode('unix'); // canonicalize all newlines to unix format
      bubbleAceEditor.setHighlightActiveLine(false);
      bubbleAceEditor.setShowPrintMargin(false);
      bubbleAceEditor.setBehavioursEnabled(false);
      bubbleAceEditor.setFontSize('10px');
      bubbleAceEditor.$blockScrolling = Infinity; // kludgy to shut up weird warnings

      $('#syntaxErrCodeDisplay').css('width', '320px');
      $('#syntaxErrCodeDisplay').css('height', '90px'); // VERY IMPORTANT so that it works on I.E., ugh!

      // don't do real-time syntax checks:
      // https://github.com/ajaxorg/ace/wiki/Syntax-validation
      s.setOption("useWorker", false);

      var lang = prevExecutionExceptionObj.myAppState.py;
      var mod = 'python';
      if (lang === 'java') {
        mod = 'java';
      } else if (lang === 'js') {
        mod = 'javascript';
      } else if (lang === 'ts') {
        mod = 'typescript';
      } else if (lang === 'ruby') {
        mod = 'ruby';
      } else if (lang === 'c' || lang === 'cpp') {
        mod = 'c_cpp';
      }
      s.setMode("ace/mode/" + mod);

      bubbleAceEditor.setReadOnly(true);

      s.setAnnotations([{row: offendingLine - 1 /* zero-indexed */,
                         column: null, /* for TS typechecking */
                         type: 'error',
                         text: prevExecutionExceptionObj.killerException.exception_msg}]);

      // scroll down to the line where the error occurred, trying to center it
      // by subtracing 3 from it (which should center it, assuming we're
      // displaying 5 lines of context)
      // TODO: maybe use the 'center' parameter of scrollToLine to make
      // it automatically look centered, instead of this hack:
      if ((offendingLine - 3) > 0) {
        (bubbleAceEditor as any /* TS too strict */).scrollToLine(offendingLine - 3);
      }

      // don't forget htmlspecialchars
      $("#syntaxErrMsg").html(pytutor.htmlspecialchars(prevExecutionExceptionObj.killerException.exception_msg));

      bub.redrawCodelineBubble(); // do an initial redraw to align everything

      //globalBub = bub; // for debugging

      // log an event whenever this bubble is show (i.e., an 'impression')
      // NB: it might actually be hidden if it appears on a line that
      // isn't initially visible to the user, but whatevers ...
      var impressionObj = {appState: optCommon.getAppState(),
                           exceptionLst: prevExecutionExceptionObjLst,
                           opt_uuid: myUuid,
                           type: 'show',
                           v: version};
      //console.log(impressionObj);
      $.get('syntax_err_survey.py', {arg: JSON.stringify(impressionObj)}, function(dat) {});
    }
  }
}
