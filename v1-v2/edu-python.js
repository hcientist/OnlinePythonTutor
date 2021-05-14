/*

Online Python Tutor
https://github.com/pgbovine/OnlinePythonTutor/

Copyright (C) 2010-2012 Philip J. Guo (philip@pgbovine.net)

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

// code that is common to all Online Python Tutor pages

var appMode = 'edit'; // 'edit', 'visualize', or 'grade' (only for question.html)

// set to true to use jsPlumb library to render connections between
// stack and heap objects
var useJsPlumbRendering = true;

// if true, then render the stack as growing downwards
// (if useJsPlumbRendering is true)
var stackGrowsDown = true;


/* colors - see edu-python.css */
var lightYellow = '#F5F798';
var lightLineColor = '#FFFFCC';
var errorColor = '#F87D76';
var visitedLineColor = '#3D58A2';

var lightGray = "#cccccc";
//var lightGray = "#dddddd";
var darkBlue = "#3D58A2";
var lightBlue = "#899CD1";
var pinkish = "#F15149";
var darkRed = "#9D1E18";


// ugh globals!
var curTrace = null;
var curInstr = 0;

// true iff trace ended prematurely since maximum instruction limit has
// been reached
var instrLimitReached = false;

function assert(cond) {
  if (!cond) {
    alert("Error: ASSERTION FAILED");
  }
}

// taken from http://www.toao.net/32-my-htmlspecialchars-function-for-javascript
function htmlspecialchars(str) {
  if (typeof(str) == "string") {
    str = str.replace(/&/g, "&amp;"); /* must do &amp; first */

    // ignore these for now ...
    //str = str.replace(/"/g, "&quot;");
    //str = str.replace(/'/g, "&#039;");

    str = str.replace(/</g, "&lt;");
    str = str.replace(/>/g, "&gt;");

    // replace spaces:
    str = str.replace(/ /g, "&nbsp;");
  }
  return str;
}

function processTrace(traceData, jumpToEnd) {
  curTrace = traceData;
  curInstr = 0;

  // delete all stale output
  $("#pyStdout").val('');

  if (curTrace.length > 0) {
    var lastEntry = curTrace[curTrace.length - 1];

    // GLOBAL!
    instrLimitReached = (lastEntry.event == 'instruction_limit_reached');

    if (instrLimitReached) {
      curTrace.pop() // kill last entry
      var warningMsg = lastEntry.exception_msg;
      $("#errorOutput").html(htmlspecialchars(warningMsg));
      $("#errorOutput").show();
    }
    // as imran suggests, for a (non-error) one-liner, SNIP off the
    // first instruction so that we start after the FIRST instruction
    // has been executed ...
    else if (curTrace.length == 2) {
      curTrace.shift();
    }


    if (jumpToEnd) {
      // if there's an exception, then jump to the FIRST occurrence of
      // that exception.  otherwise, jump to the very end of execution.
      curInstr = curTrace.length - 1;

      for (var i = 0; i < curTrace.length; i++) {
        var curEntry = curTrace[i];
        if (curEntry.event == 'exception' ||
            curEntry.event == 'uncaught_exception') {
          curInstr = i;
          break;
        }
      }
    }

  }

  updateOutput();
}

function highlightCodeLine(curLine, visitedLinesSet, hasError, isTerminated) {
  var tbl = $("table#pyCodeOutput");

  // reset then set:
  tbl.find('td.lineNo').css('color', '');
  tbl.find('td.lineNo').css('font-weight', '');

  $.each(visitedLinesSet, function(k, v) {
    tbl.find('td.lineNo:eq(' + (k - 1) + ')').css('color', visitedLineColor);
    tbl.find('td.lineNo:eq(' + (k - 1) + ')').css('font-weight', 'bold');
  });

  var lineBgCol = lightLineColor;
  if (hasError) {
    lineBgCol = errorColor;
  }

	// put a default white top border to keep space usage consistent
  tbl.find('td.cod').css('border-top', '1px solid #ffffff');

  if (!hasError && !isTerminated) {
    tbl.find('td.cod:eq(' + (curLine - 1) + ')').css('border-top', '1px solid #F87D76');
  }

  tbl.find('td.cod').css('background-color', '');
  if (!isTerminated || hasError) {
    tbl.find('td.cod:eq(' + (curLine - 1) + ')').css('background-color', lineBgCol);
  }
  else if (isTerminated) {
    tbl.find('td.cod:eq(' + (curLine - 1) + ')').css('background-color', lightBlue);
  }
}

// relies on curTrace and curInstr globals
function updateOutput() {
  if (!curTrace) {
    return;
  }

  useJsPlumbRendering = !($("#classicModeCheckbox").prop("checked"));

  var curEntry = curTrace[curInstr];
  var hasError = false;

  // render VCR controls:
  var totalInstrs = curTrace.length;

  // to be user-friendly, if we're on the LAST instruction, print "Program has terminated"
  // and DON'T highlight any lines of code in the code display
  if (curInstr == (totalInstrs-1)) {
    if (instrLimitReached) {
      $("#vcrControls #curInstr").html("Instruction limit reached");
    }
    else {
      $("#vcrControls #curInstr").html("Program has terminated");
    }
  }
  else {
    $("#vcrControls #curInstr").html("About to do step " + (curInstr + 1) + " of " + (totalInstrs-1));
  }

  $("#vcrControls #jmpFirstInstr").attr("disabled", false);
  $("#vcrControls #jmpStepBack").attr("disabled", false);
  $("#vcrControls #jmpStepFwd").attr("disabled", false);
  $("#vcrControls #jmpLastInstr").attr("disabled", false);

  if (curInstr == 0) {
    $("#vcrControls #jmpFirstInstr").attr("disabled", true);
    $("#vcrControls #jmpStepBack").attr("disabled", true);
  }
  if (curInstr == (totalInstrs-1)) {
    $("#vcrControls #jmpLastInstr").attr("disabled", true);
    $("#vcrControls #jmpStepFwd").attr("disabled", true);
  }


  // render error (if applicable):
  if (curEntry.event == 'exception' ||
      curEntry.event == 'uncaught_exception') {
    assert(curEntry.exception_msg);

    if (curEntry.exception_msg == "Unknown error") {
      $("#errorOutput").html('Unknown error: Please email a bug report to philip@pgbovine.net');
    }
    else {
      $("#errorOutput").html(htmlspecialchars(curEntry.exception_msg));
    }

    $("#errorOutput").show();

    hasError = true;
  }
  else {
    if (!instrLimitReached) { // ugly, I know :/
      $("#errorOutput").hide();
    }
  }


  // render code output:
  if (curEntry.line) {
    // calculate all lines that have been 'visited' 
    // by execution up to (but NOT INCLUDING) curInstr:
    var visitedLinesSet = {}
    for (var i = 0; i < curInstr; i++) {
      if (curTrace[i].line) {
        visitedLinesSet[curTrace[i].line] = true;
      }
    }
    highlightCodeLine(curEntry.line, visitedLinesSet, hasError,
                      /* if instrLimitReached, then treat like a normal non-terminating line */
                      (!instrLimitReached && (curInstr == (totalInstrs-1))));
  }


  // render stdout:

  // keep original horizontal scroll level:
  var oldLeft = $("#pyStdout").scrollLeft();
  $("#pyStdout").val(curEntry.stdout);

  $("#pyStdout").scrollLeft(oldLeft);
  // scroll to bottom, tho:
  $("#pyStdout").scrollTop($("#pyStdout").attr('scrollHeight'));


  // finally, render all the data structures!!!
  renderDataStructures(curEntry, "#dataViz");
}

// Renders the current trace entry (curEntry) into the div named by vizDiv
function renderDataStructures(curEntry, vizDiv) {
  if (useJsPlumbRendering) { 
    renderDataStructuresVersion2(curEntry, vizDiv);
  }
  else {
    renderDataStructuresVersion1(curEntry, vizDiv);
  }
}


// The ORIGINAL "1.0" version of renderDataStructures, which renders
// variables and values INLINE within each stack frame without any
// explicit representation of data structure aliasing.
//
// This version was originally created in January 2010
function renderDataStructuresVersion1(curEntry, vizDiv) {
  // render data structures:

  $(vizDiv).empty(); // jQuery empty() is better than .html('')

  // render locals on stack:
  if (curEntry.stack_locals != undefined) {
    $.each(curEntry.stack_locals, function (i, frame) {
      var funcName = htmlspecialchars(frame[0]); // might contain '<' or '>' for weird names like <genexpr>
      var localVars = frame[1];

      $(vizDiv).append('<div class="vizFrame">Local variables for <span style="font-family: Andale mono, monospace;">' + funcName + '</span>:</div>');

      // render locals in alphabetical order for tidiness:
      var orderedVarnames = [];

      // use plain ole' iteration rather than jQuery $.each() since
      // the latter breaks when a variable is named "length"
      for (varname in localVars) {
        orderedVarnames.push(varname);
      }
      orderedVarnames.sort();

      if (orderedVarnames.length > 0) {
        $(vizDiv + " .vizFrame:last").append('<br/><table class="frameDataViz"></table>');
        var tbl = $("#pyOutputPane table:last");
        $.each(orderedVarnames, function(i, varname) {
          var val = localVars[varname];
          tbl.append('<tr><td class="varname"></td><td class="val"></td></tr>');
          var curTr = tbl.find('tr:last');
          if (varname == '__return__') {
            curTr.find("td.varname").html('<span style="font-size: 10pt; font-style: italic;">return value</span>');
          }
          else {
            curTr.find("td.varname").html(varname);
          }
          renderData(val, curTr.find("td.val"), false);
        });

        tbl.find("tr:last").find("td.varname").css('border-bottom', '0px');
        tbl.find("tr:last").find("td.val").css('border-bottom', '0px');
      }
      else {
        $(vizDiv + " .vizFrame:last").append(' <i>none</i>');
      }
    });
  }


  // render globals LAST:

  $(vizDiv).append('<div class="vizFrame">Global variables:</div>');

  var nonEmptyGlobals = false;
  var curGlobalFields = {};
  if (curEntry.globals != undefined) {
    // use plain ole' iteration rather than jQuery $.each() since
    // the latter breaks when a variable is named "length"
    for (varname in curEntry.globals) {
      curGlobalFields[varname] = true;
      nonEmptyGlobals = true;
    }
  }

  if (nonEmptyGlobals) {
    $(vizDiv + " .vizFrame:last").append('<br/><table class="frameDataViz"></table>');

    // render all global variables IN THE ORDER they were created by the program,
    // in order to ensure continuity:
    //
    // TODO: in the future, the back-end can actually pre-compute this
    // list so that the front-end doesn't have to do any extra work!

    var orderedGlobals = []

    // iterating over ALL instructions (could be SLOW if not for our optimization below)
    for (var i = 0; i <= curInstr; i++) {
      // some entries (like for exceptions) don't have GLOBALS
      if (curTrace[i].globals == undefined) continue;

      // use plain ole' iteration rather than jQuery $.each() since
      // the latter breaks when a variable is named "length"
      for (varname in curTrace[i].globals) {
        // eliminate duplicates (act as an ordered set)
        if ($.inArray(varname, orderedGlobals) == -1) {
          orderedGlobals.push(varname);
          curGlobalFields[varname] = undefined; // 'unset it'
        }
      }

      var earlyStop = true;
      // as an optimization, STOP as soon as you've found everything in curGlobalFields:
      for (o in curGlobalFields) {
        if (curGlobalFields[o] != undefined) {
          earlyStop = false;
          break;
        }
      }

      if (earlyStop) {
        break;
      }
    }

    var tbl = $("#pyOutputPane table:last");

    // iterate IN ORDER (it's possible that not all vars are in curEntry.globals)
    $.each(orderedGlobals, function(i, varname) {
      var val = curEntry.globals[varname];
      // (use '!==' to do an EXACT match against undefined)
      if (val !== undefined) { // might not be defined at this line, which is OKAY!
        tbl.append('<tr><td class="varname"></td><td class="val"></td></tr>');
        var curTr = tbl.find('tr:last');
        curTr.find("td.varname").html(varname);
        renderData(val, curTr.find("td.val"), false);
      }
    });

    tbl.find("tr:last").find("td.varname").css('border-bottom', '0px');
    tbl.find("tr:last").find("td.val").css('border-bottom', '0px');
  }
  else {
    $(vizDiv + " .vizFrame:last").append(' <i>none</i>');
  }

}


// make sure varname doesn't contain any weird
// characters that are illegal for CSS ID's ...
//
// I know for a fact that iterator tmp variables named '_[1]'
// are NOT legal names for CSS ID's.
// I also threw in '{', '}', '(', ')', '<', '>' as illegal characters.
//
// TODO: what other characters are illegal???
var lbRE = new RegExp('\\[|{|\\(|<', 'g');
var rbRE = new RegExp('\\]|}|\\)|>', 'g');
function varnameToCssID(varname) {
  return varname.replace(lbRE, 'LeftB_').replace(rbRE, '_RightB');
}

// The "2.0" version of renderDataStructures, which renders variables in
// a stack and values in a separate heap, with data structure aliasing
// explicitly represented via line connectors (thanks to jsPlumb lib).
//
// This version was originally created in September 2011
function renderDataStructuresVersion2(curEntry, vizDiv) {

  // before we wipe out the old state of the visualization, CLEAR all
  // the click listeners first
  $(".stackFrameHeader").unbind();

  // VERY VERY IMPORTANT --- and reset ALL jsPlumb state to prevent
  // weird mis-behavior!!!
  jsPlumb.reset();


  $(vizDiv).empty(); // jQuery empty() is better than .html('')


  // create a tabular layout for stack and heap side-by-side
  // TODO: figure out how to do this using CSS in a robust way!
  $(vizDiv).html('<table id="stackHeapTable"><tr><td id="stack_td"><div id="stack"></div></td><td id="heap_td"><div id="heap"></div></td></tr></table>');

  $(vizDiv + " #stack").append('<div id="stackHeader">Stack grows <select id="stack_growth_selector"><option>down</option><option>up</option></select></div>');

  // select a state based on stackGrowsDown global variable:
  if (stackGrowsDown) {
    $("#stack_growth_selector").val('down');
  }
  else {
    $("#stack_growth_selector").val('up');
  }

  // add trigger
  $("#stack_growth_selector").change(function() {
    var v = $("#stack_growth_selector").val();
    if (v == 'down') {
      stackGrowsDown = true;
    }
    else {
      stackGrowsDown = false;
    }

    updateOutput(); // refresh display!!!
  });


  var nonEmptyGlobals = false;
  var curGlobalFields = {};
  if (curEntry.globals != undefined) {
    // use plain ole' iteration rather than jQuery $.each() since
    // the latter breaks when a variable is named "length"
    for (varname in curEntry.globals) {
      curGlobalFields[varname] = true;
      nonEmptyGlobals = true;
    }
  }

  // render all global variables IN THE ORDER they were created by the program,
  // in order to ensure continuity:
  var orderedGlobals = []

  if (nonEmptyGlobals) {
    // iterating over ALL instructions up to curInstr
    // (could be SLOW if not for our optimization below)
    //
    // TODO: this loop still seems like it can be optimized further if necessary
    for (var i = 0; i <= curInstr; i++) {
      // some entries (like for exceptions) don't have GLOBALS
      if (curTrace[i].globals == undefined) continue;

      // use plain ole' iteration rather than jQuery $.each() since
      // the latter breaks when a variable is named "length"
      for (varname in curTrace[i].globals) {
        // eliminate duplicates (act as an ordered set)
        if ($.inArray(varname, orderedGlobals) == -1) {
          orderedGlobals.push(varname);
          curGlobalFields[varname] = undefined; // 'unset it'
        }
      }

      var earlyStop = true;
      // as an optimization, STOP as soon as you've found everything in curGlobalFields:
      for (o in curGlobalFields) {
        if (curGlobalFields[o] != undefined) {
          earlyStop = false;
          break;
        }
      }

      if (earlyStop) {
        break;
      }
    }
  }


  // Key:   CSS ID of the div element representing the variable
  // Value: CSS ID of the div element representing the value rendered in the heap
  connectionEndpointIDs = {};


  // nested helper functions are helpful!
  function renderGlobals() {
    // render global variables:
    if (orderedGlobals.length > 0) {
      $(vizDiv + " #stack").append('<div class="stackFrame" id="globals"><div id="globals_header" class="stackFrameHeader inactiveStackFrameHeader">Global variables</div></div>');

      $(vizDiv + " #stack #globals").append('<table class="stackFrameVarTable" id="global_table"></table>');

      var tbl = $(vizDiv + " #global_table");
      // iterate IN ORDER (it's possible that not all vars are in curEntry.globals)
      $.each(orderedGlobals, function(i, varname) {
        var val = curEntry.globals[varname];
        // (use '!==' to do an EXACT match against undefined)
        if (val !== undefined) { // might not be defined at this line, which is OKAY!
          tbl.append('<tr><td class="stackFrameVar">' + varname + '</td><td class="stackFrameValue"></td></tr>');
          var curTr = tbl.find('tr:last');

          // render primitives inline
          if (isPrimitiveType(val)) {
            renderData(val, curTr.find("td.stackFrameValue"), false);
          }
          else {
            // add a stub so that we can connect it with a connector later.
            // IE needs this div to be NON-EMPTY in order to properly
            // render jsPlumb endpoints, so that's why we add an "&nbsp;"!

            // make sure varname doesn't contain any weird
            // characters that are illegal for CSS ID's ...
            var varDivID = 'global__' + varnameToCssID(varname);
            curTr.find("td.stackFrameValue").append('<div id="' + varDivID + '">&nbsp;</div>');

            assert(connectionEndpointIDs[varDivID] === undefined);
            var heapObjID = 'heap_object_' + getObjectID(val);
            connectionEndpointIDs[varDivID] = heapObjID;
          }
        }
      });
    }
  }

  function renderStackFrame(frame) {
    var funcName = htmlspecialchars(frame[0]); // might contain '<' or '>' for weird names like <genexpr>
    var localVars = frame[1];

    // the stackFrame div's id is simply its index ("stack<index>")
    var divClass = (i==0) ? "stackFrame topStackFrame" : "stackFrame";
    var divID = "stack" + i;
    $(vizDiv + " #stack").append('<div class="' + divClass + '" id="' + divID + '"></div>');

    var headerDivID = "stack_header" + i;
    $(vizDiv + " #stack #" + divID).append('<div id="' + headerDivID + '" class="stackFrameHeader inactiveStackFrameHeader">' + funcName + '</div>');

    // render locals in alphabetical order for tidiness:
    // TODO: later on, render locals in order of first appearance, for consistency!!!
    // (the back-end can actually pre-compute this list so that the
    // front-end doesn't have to do any extra work!)
    var orderedVarnames = [];

    // use plain ole' iteration rather than jQuery $.each() since
    // the latter breaks when a variable is named "length"
    for (varname in localVars) {
      orderedVarnames.push(varname);
    }
    orderedVarnames.sort();

    if (orderedVarnames.length > 0) {
      var tableID = divID + '_table';
      $(vizDiv + " #stack #" + divID).append('<table class="stackFrameVarTable" id="' + tableID + '"></table>');

      var tbl = $(vizDiv + " #" + tableID);

      // put return value at the VERY END (if it exists)
      var retvalIdx = $.inArray('__return__', orderedVarnames); // more robust than indexOf()
      if (retvalIdx > -1) {
        orderedVarnames.splice(retvalIdx, 1);
        orderedVarnames.push('__return__');
      }

      $.each(orderedVarnames, function(i, varname) {
        var val = localVars[varname];

        // special treatment for displaying return value and indicating
        // that the function is about to return to its caller
        if (varname == '__return__') {
          assert(curEntry.event == 'return'); // sanity check

          tbl.append('<tr><td colspan="2" class="returnWarning">About to return to caller</td></tr>');
          tbl.append('<tr><td class="stackFrameVar"><span class="retval">Return value:</span></td><td class="stackFrameValue"></td></tr>');
        }
        else {
          tbl.append('<tr><td class="stackFrameVar">' + varname + '</td><td class="stackFrameValue"></td></tr>');
        }

        var curTr = tbl.find('tr:last');

        // render primitives inline and compound types on the heap
        if (isPrimitiveType(val)) {
          renderData(val, curTr.find("td.stackFrameValue"), false);
        }
        else {
          // add a stub so that we can connect it with a connector later.
          // IE needs this div to be NON-EMPTY in order to properly
          // render jsPlumb endpoints, so that's why we add an "&nbsp;"!

          // make sure varname doesn't contain any weird
          // characters that are illegal for CSS ID's ...
          var varDivID = divID + '__' + varnameToCssID(varname);
          curTr.find("td.stackFrameValue").append('<div id="' + varDivID + '">&nbsp;</div>');

          assert(connectionEndpointIDs[varDivID] === undefined);
          var heapObjID = 'heap_object_' + getObjectID(val);
          connectionEndpointIDs[varDivID] = heapObjID;
        }
      });

    }

  }


  // first render the stack (and global vars)

  if (stackGrowsDown) {
    renderGlobals();
    if (curEntry.stack_locals) {
      for (var i = curEntry.stack_locals.length - 1; i >= 0; i--) {
        var frame = curEntry.stack_locals[i];
        renderStackFrame(frame);
      }
    }
  }
  else {
    if (curEntry.stack_locals) {
      for (var i = 0; i < curEntry.stack_locals.length; i++) {
        var frame = curEntry.stack_locals[i];
        renderStackFrame(frame);
      }
    }
    renderGlobals();
  }


  // then render the heap

  alreadyRenderedObjectIDs = {}; // set of object IDs that have already been rendered

  // if addToEnd is true, then APPEND to the end of the heap,
  // otherwise PREPEND to the front
  function renderHeapObject(obj, addToEnd) {
    var objectID = getObjectID(obj);

    if (alreadyRenderedObjectIDs[objectID] === undefined) {
      var heapObjID = 'heap_object_' + objectID;
      var newDiv = '<div class="heapObject" id="' + heapObjID + '"></div>';

      if (addToEnd) {
        $(vizDiv + ' #heap').append(newDiv);
      }
      else {
        $(vizDiv + ' #heap').prepend(newDiv);
      }
      renderData(obj, $(vizDiv + ' #heap #' + heapObjID), false);

      alreadyRenderedObjectIDs[objectID] = 1;
    }
  }


  // if there are multiple aliases to the same object, we want to render
  // the one deepest in the stack, so that we can hopefully prevent
  // objects from jumping around as functions are called and returned.
  // e.g., if a list L appears as a global variable and as a local in a
  // function, we want to render L when rendering the global frame.

  if (stackGrowsDown) {
    // this is straightforward: just go through globals first and then
    // each stack frame in order :)

    $.each(orderedGlobals, function(i, varname) {
      var val = curEntry.globals[varname];

      // primitive types are already rendered in the stack
      if (!isPrimitiveType(val)) {
        renderHeapObject(val, true); // APPEND
      }
    });

    if (curEntry.stack_locals) {
      $.each(curEntry.stack_locals, function(i, frame) {
        var localVars = frame[1];

        var orderedVarnames = [];

        // use plain ole' iteration rather than jQuery $.each() since
        // the latter breaks when a variable is named "length"
        for (varname in localVars) {
          orderedVarnames.push(varname);
        }
        orderedVarnames.sort();

        $.each(orderedVarnames, function(i2, varname) {
          var val = localVars[varname];

          // primitive types are already rendered in the stack
          if (!isPrimitiveType(val)) {
            renderHeapObject(val, true); // APPEND
          }
        });
      });
    }

  }
  else {
    // to accomplish this goal, go BACKWARDS starting at globals and
    // crawl up the stack, PREPENDING elements to the front of #heap

    for (var i = orderedGlobals.length - 1; i >= 0; i--) {
      var varname = orderedGlobals[i];
      var val = curEntry.globals[varname];

      // primitive types are already rendered in the stack
      if (!isPrimitiveType(val)) {
        renderHeapObject(val, false); // PREPEND
      }
    }

    if (curEntry.stack_locals) {
      // go BACKWARDS
      for (var i = curEntry.stack_locals.length - 1; i >= 0; i--) {
        var frame = curEntry.stack_locals[i];
        var localVars = frame[1];

        var orderedVarnames = [];

        // use plain ole' iteration rather than jQuery $.each() since
        // the latter breaks when a variable is named "length"
        for (varname in localVars) {
          orderedVarnames.push(varname);
        }
        orderedVarnames.sort();

        orderedVarnames.reverse(); // so that we can iterate backwards

        $.each(orderedVarnames, function(i, varname) {
          var val = localVars[varname];

          // primitive types are already rendered in the stack
          if (!isPrimitiveType(val)) {
            renderHeapObject(val, false); // PREPEND
          }
        });
      }
    }

  }

  
  // prepend heap header after all the dust settles:
  $(vizDiv + ' #heap').prepend('<div id="heapHeader">Heap</div>');


  // finally connect stack variables to heap objects via connectors
  for (varID in connectionEndpointIDs) {
    var valueID = connectionEndpointIDs[varID];
    jsPlumb.connect({source: varID, target: valueID});
  }


  // add an on-click listener to all stack frame headers
  $(".stackFrameHeader").click(function() {
    var enclosingStackFrame = $(this).parent();
    var enclosingStackFrameID = enclosingStackFrame.attr('id');

    var allConnections = jsPlumb.getConnections();
    for (var i = 0; i < allConnections.length; i++) {
      var c = allConnections[i];

      // this is VERY VERY fragile code, since it assumes that going up
      // five layers of parent() calls will get you from the source end
      // of the connector to the enclosing stack frame
      var stackFrameDiv = c.source.parent().parent().parent().parent().parent();

      // if this connector starts in the selected stack frame ...
      if (stackFrameDiv.attr('id') == enclosingStackFrameID) {
        // then HIGHLIGHT IT!
        c.setPaintStyle({lineWidth:2, strokeStyle: darkBlue});
        c.endpoints[0].setPaintStyle({fillStyle: darkBlue});
        c.endpoints[1].setVisible(false, true, true); // JUST set right endpoint to be invisible

        // ... and move it to the VERY FRONT
        $(c.canvas).css("z-index", 1000);
      }
      else {
        // else unhighlight it
        c.setPaintStyle({lineWidth:1, strokeStyle: lightGray});
        c.endpoints[0].setPaintStyle({fillStyle: lightGray});
        c.endpoints[1].setVisible(false, true, true); // JUST set right endpoint to be invisible
        $(c.canvas).css("z-index", 0);
      }
    }

    // clear everything, then just activate $(this) one ...
    $(".stackFrame").removeClass("selectedStackFrame");
    $(".stackFrameHeader").addClass("inactiveStackFrameHeader");

    enclosingStackFrame.addClass("selectedStackFrame");
    $(this).removeClass("inactiveStackFrameHeader");
  });


  // 'click' on the top-most stack frame if available,
  // or on "Global variables" otherwise
  if (curEntry.stack_locals != undefined && curEntry.stack_locals.length > 0) {
    $('#stack_header0').trigger('click');
  }
  else {
    $('#globals_header').trigger('click');
  }

}

function isPrimitiveType(obj) {
  var typ = typeof obj;
  return ((obj == null) || (typ != "object"));
}

function getObjectID(obj) {
  // pre-condition
  assert(!isPrimitiveType(obj));
  assert($.isArray(obj));

  if ((obj[0] == 'INSTANCE') || (obj[0] == 'CLASS')) {
    return obj[2];
  }
  else {
    return obj[1];
  }
}


// render the JS data object obj inside of jDomElt,
// which is a jQuery wrapped DOM object
// (obj is in a format encoded by cgi-bin/pg_encoder.py)
function renderData(obj, jDomElt, ignoreIDs) {
  // dispatch on types:
  var typ = typeof obj;

  if (obj == null) {
    jDomElt.append('<span class="nullObj">None</span>');
  }
  else if (typ == "number") {
    jDomElt.append('<span class="numberObj">' + obj + '</span>');
  }
  else if (typ == "boolean") {
    if (obj) {
      jDomElt.append('<span class="boolObj">True</span>');
    }
    else {
      jDomElt.append('<span class="boolObj">False</span>');
    }
  }
  else if (typ == "string") {
    // escape using htmlspecialchars to prevent HTML/script injection
    var literalStr = htmlspecialchars(obj);

    // print as a double-quoted string literal
    literalStr = literalStr.replace(new RegExp('\"', 'g'), '\\"'); // replace ALL
    literalStr = '"' + literalStr + '"';

    jDomElt.append('<span class="stringObj">' + literalStr + '</span>');
  }
  else if (typ == "object") {
    assert($.isArray(obj));

    var idStr = '';
    if (!ignoreIDs) {
      idStr = ' (id=' + getObjectID(obj) + ')';
    }

    if (obj[0] == 'LIST') {
      assert(obj.length >= 2);
      if (obj.length == 2) {
        jDomElt.append('<div class="typeLabel">empty list' + idStr + '</div>');
      }
      else {
        jDomElt.append('<div class="typeLabel">list' + idStr + ':</div>');

        jDomElt.append('<table class="listTbl"><tr></tr><tr></tr></table>');
        var tbl = jDomElt.children('table');
        var headerTr = tbl.find('tr:first');
        var contentTr = tbl.find('tr:last');
        jQuery.each(obj, function(ind, val) {
          if (ind < 2) return; // skip 'LIST' tag and ID entry

          // add a new column and then pass in that newly-added column
          // as jDomElt to the recursive call to child:
          headerTr.append('<td class="listHeader"></td>');
          headerTr.find('td:last').append(ind - 2);

          contentTr.append('<td class="listElt"></td>');
          renderData(val, contentTr.find('td:last'), ignoreIDs);
        });
      }
    }
    else if (obj[0] == 'TUPLE') {
      assert(obj.length >= 2);
      if (obj.length == 2) {
        jDomElt.append('<div class="typeLabel">empty tuple' + idStr + '</div>');
      }
      else {
        jDomElt.append('<div class="typeLabel">tuple' + idStr + ':</div>');
        jDomElt.append('<table class="tupleTbl"><tr></tr><tr></tr></table>');
        var tbl = jDomElt.children('table');
        var headerTr = tbl.find('tr:first');
        var contentTr = tbl.find('tr:last');
        jQuery.each(obj, function(ind, val) {
          if (ind < 2) return; // skip 'TUPLE' tag and ID entry

          // add a new column and then pass in that newly-added column
          // as jDomElt to the recursive call to child:
          headerTr.append('<td class="tupleHeader"></td>');
          headerTr.find('td:last').append(ind - 2);

          contentTr.append('<td class="tupleElt"></td>');
          renderData(val, contentTr.find('td:last'), ignoreIDs);
        });
      }
    }
    else if (obj[0] == 'SET') {
      assert(obj.length >= 2);
      if (obj.length == 2) {
        jDomElt.append('<div class="typeLabel">empty set' + idStr + '</div>');
      }
      else {
        jDomElt.append('<div class="typeLabel">set' + idStr + ':</div>');
        jDomElt.append('<table class="setTbl"></table>');
        var tbl = jDomElt.children('table');
        // create an R x C matrix:
        var numElts = obj.length - 2;
        // gives roughly a 3x5 rectangular ratio, square is too, err,
        // 'square' and boring
        var numRows = Math.round(Math.sqrt(numElts));
        if (numRows > 3) {
          numRows -= 1;
        }

        var numCols = Math.round(numElts / numRows);
        // round up if not a perfect multiple:
        if (numElts % numRows) {
          numCols += 1;
        }

        jQuery.each(obj, function(ind, val) {
          if (ind < 2) return; // skip 'SET' tag and ID entry

          if (((ind - 2) % numCols) == 0) {
            tbl.append('<tr></tr>');
          }

          var curTr = tbl.find('tr:last');
          curTr.append('<td class="setElt"></td>');
          renderData(val, curTr.find('td:last'), ignoreIDs);
        });
      }
    }
    else if (obj[0] == 'DICT') {
      assert(obj.length >= 2);
      if (obj.length == 2) {
        jDomElt.append('<div class="typeLabel">empty dict' + idStr + '</div>');
      }
      else {
        jDomElt.append('<div class="typeLabel">dict' + idStr + ':</div>');
        jDomElt.append('<table class="dictTbl"></table>');
        var tbl = jDomElt.children('table');
        $.each(obj, function(ind, kvPair) {
          if (ind < 2) return; // skip 'DICT' tag and ID entry

          tbl.append('<tr class="dictEntry"><td class="dictKey"></td><td class="dictVal"></td></tr>');
          var newRow = tbl.find('tr:last');
          var keyTd = newRow.find('td:first');
          var valTd = newRow.find('td:last');
          renderData(kvPair[0], keyTd, ignoreIDs);
          renderData(kvPair[1], valTd, ignoreIDs);
        });
      }
    }
    else if (obj[0] == 'INSTANCE') {
      assert(obj.length >= 3);
      jDomElt.append('<div class="typeLabel">' + obj[1] + ' instance' + idStr + '</div>');

      if (obj.length > 3) {
        jDomElt.append('<table class="instTbl"></table>');
        var tbl = jDomElt.children('table');
        $.each(obj, function(ind, kvPair) {
          if (ind < 3) return; // skip type tag, class name, and ID entry

          tbl.append('<tr class="instEntry"><td class="instKey"></td><td class="instVal"></td></tr>');
          var newRow = tbl.find('tr:last');
          var keyTd = newRow.find('td:first');
          var valTd = newRow.find('td:last');

          // the keys should always be strings, so render them directly (and without quotes):
          assert(typeof kvPair[0] == "string");
          var attrnameStr = htmlspecialchars(kvPair[0]);
          keyTd.append('<span class="keyObj">' + attrnameStr + '</span>');

          // values can be arbitrary objects, so recurse:
          renderData(kvPair[1], valTd, ignoreIDs);
        });
      }
    }
    else if (obj[0] == 'CLASS') {
      assert(obj.length >= 4);
      var superclassStr = '';
      if (obj[3].length > 0) {
        superclassStr += ('[extends ' + obj[3].join(',') + '] ');
      }

      jDomElt.append('<div class="typeLabel">' + obj[1] + ' class ' + superclassStr + idStr + '</div>');

      if (obj.length > 4) {
        jDomElt.append('<table class="classTbl"></table>');
        var tbl = jDomElt.children('table');
        $.each(obj, function(ind, kvPair) {
          if (ind < 4) return; // skip type tag, class name, ID, and superclasses entries

          tbl.append('<tr class="classEntry"><td class="classKey"></td><td class="classVal"></td></tr>');
          var newRow = tbl.find('tr:last');
          var keyTd = newRow.find('td:first');
          var valTd = newRow.find('td:last');

          // the keys should always be strings, so render them directly (and without quotes):
          assert(typeof kvPair[0] == "string");
          var attrnameStr = htmlspecialchars(kvPair[0]);
          keyTd.append('<span class="keyObj">' + attrnameStr + '</span>');

          // values can be arbitrary objects, so recurse:
          renderData(kvPair[1], valTd, ignoreIDs);
        });
      }
    }

    else if (obj[0] == 'CIRCULAR_REF') {
      assert(obj.length == 2);
      jDomElt.append('<div class="circRefLabel">circular reference to id=' + obj[1] + '</div>');
    }
    else {
      // render custom data type
      assert(obj.length == 3);
      typeName = obj[0];
      id = obj[1];
      strRepr = obj[2];

      // if obj[2] is like '<generator object <genexpr> at 0x84760>',
      // then display an abbreviated version rather than the gory details
      noStrReprRE = /<.* at 0x.*>/;
      if (noStrReprRE.test(strRepr)) {
        jDomElt.append('<span class="customObj">' + typeName + idStr + '</span>');
      }
      else {
        strRepr = htmlspecialchars(strRepr); // escape strings!

        // warning: we're overloading tuple elts for custom data types
        jDomElt.append('<div class="typeLabel">' + typeName + idStr + ':</div>');
        jDomElt.append('<table class="tupleTbl"><tr><td class="tupleElt">' + strRepr + '</td></tr></table>');
      }
    }
  }
  else {
    alert("Error: renderData FAIL!");
  }
}


String.prototype.rtrim = function() {
  return this.replace(/\s*$/g, "");
}

function renderPyCodeOutput(codeStr) {
  var tbl = $("#pyCodeOutput");
  tbl.empty(); // jQuery empty() is better than .html('')
  var lines = codeStr.rtrim().split('\n');

  $.each(lines, function(i, cod) {
    var lineNo = i + 1;
    var htmlCod = htmlspecialchars(cod);

    tbl.append('<tr><td class="lineNo"></td><td class="cod"></td></tr>');
    var curRow = tbl.find('tr:last');
    curRow.find('td.lineNo').html(lineNo);
    curRow.find('td.cod').html(htmlCod);
  });

}

// initialization function that should be called when the page is loaded
function eduPythonCommonInit() {
  $("#jmpFirstInstr").click(function() {
    curInstr = 0;
    updateOutput();
  });

  $("#jmpLastInstr").click(function() {
    curInstr = curTrace.length - 1;
    updateOutput();
  });

  $("#jmpStepBack").click(function() {
    if (curInstr > 0) {
      curInstr -= 1;
      updateOutput();
    }
  });

  $("#jmpStepFwd").click(function() {
    if (curInstr < curTrace.length - 1) {
      curInstr += 1;
      updateOutput();
    }
  });

  // disable controls initially ...
  $("#vcrControls #jmpFirstInstr").attr("disabled", true);
  $("#vcrControls #jmpStepBack").attr("disabled", true);
  $("#vcrControls #jmpStepFwd").attr("disabled", true);
  $("#vcrControls #jmpLastInstr").attr("disabled", true);


  // set some sensible jsPlumb defaults
  jsPlumb.Defaults.Endpoint = ["Dot", {radius:3}];
  //jsPlumb.Defaults.Endpoint = ["Rectangle", {width:3, height:3}];
  jsPlumb.Defaults.EndpointStyle = {fillStyle: lightGray};
  jsPlumb.Defaults.Anchors = ["RightMiddle", "LeftMiddle"];
  jsPlumb.Defaults.Connector = [ "Bezier", { curviness:15 }]; /* too much 'curviness' causes lines to run together */
  jsPlumb.Defaults.PaintStyle = {lineWidth:1, strokeStyle: lightGray};

  // experiment with arrows ...
  jsPlumb.Defaults.Overlays = [[ "Arrow", { length: 14, width:10, foldback:0.55, location:0.35 }]]

  jsPlumb.Defaults.EndpointHoverStyle = {fillStyle: pinkish};
  jsPlumb.Defaults.HoverPaintStyle = {lineWidth:2, strokeStyle: pinkish};


  // set keyboard event listeners ...
  $(document).keydown(function(k) {
    // ONLY capture keys if we're in 'visualize code' mode:
    if (appMode == 'visualize') {
      if (k.keyCode == 37) { // left arrow
        if (!$("#vcrControls #jmpStepBack").attr("disabled")) {
          $("#jmpStepBack").trigger('click');
          k.preventDefault(); // don't horizontally scroll the display
        }
      }
      else if (k.keyCode == 39) { // right arrow
        if (!$("#vcrControls #jmpStepFwd").attr("disabled")) {
          $("#jmpStepFwd").trigger('click');
          k.preventDefault(); // don't horizontally scroll the display
        }
      }
    }
  });

  // redraw everything on window resize so that connectors are in the
  // right place
  // TODO: can be SLOW on older browsers!!!
  $(window).resize(function() {
    if (appMode == 'visualize') {
      updateOutput();
    }
  });

  $("#classicModeCheckbox").click(function() {
    if (appMode == 'visualize') {
      updateOutput();
    }
  });


  // log a generic AJAX error handler
  $(document).ajaxError(function() {
    alert("Uh oh, the server returned an error, boo :(  Please reload the page and try executing a different Python script.");
  });

}

