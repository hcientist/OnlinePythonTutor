/*

Online Python Tutor
Copyright (C) 2010 Philip J. Guo (philip@pgbovine.net)
https://github.com/pgbovine/OnlinePythonTutor/

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

// The Online Python Tutor front-end, which calls the cgi-bin/web_exec.py
// back-end with a string representing the user's script POST['user_script']
// and receives a complete execution trace, which it parses and displays to HTML.


// set to true to use jsPlumb library to render connections between
// stack and heap objects
var useJsPlumbRendering = true;

// if true, then render the stack as growing downwards
// (if useJsPlumbRendering is true)
var stackGrowsDown = true;


var localTesting = false; // if this is true, mock-data.js had also better be included


/* colors - see edu-python.css */
var lightYellow = '#F5F798';
var lightLineColor = '#FFFFCC';
var errorColor = '#F87D76';
var visitedLineColor = '#3D58A2';

var lightGray = "#dddddd";
var darkBlue = "#3D58A2";
var pinkish = "#F15149";


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

function processTrace(traceData) {
  curTrace = traceData;
  curInstr = 0;

  // delete all stale output
  $("#warningOutput").html('');
  $("#pyStdout").val('');

  if (curTrace.length > 0) {
    var lastEntry = curTrace[curTrace.length - 1];

    // GLOBAL!
    instrLimitReached = (lastEntry.event == 'instruction_limit_reached');

    // if there is some sort of error, then JUMP to it so that we can
    // immediately alert the user:
    // (cgi-bin/pg_logger.py ensures that if there is an uncaught
    //  exception, then that exception event will be the FINAL
    //  entry in curTrace.  a caught exception will appear somewhere in
    //  the MIDDLE of curTrace)
    //
    // on second thought, let's hold off on that for now

    /*
    if (lastEntry.event == 'exception' ||
        lastEntry.event == 'uncaught_exception') {
      // updateOutput should take care of the rest ...
      curInstr = curTrace.length - 1;
    }
    */
    if (instrLimitReached) {
      curTrace.pop() // kill last entry
      var warningMsg = lastEntry.exception_msg;
      $("#warningOutput").html(htmlspecialchars(warningMsg));
    }
    // as imran suggests, for a (non-error) one-liner, SNIP off the
    // first instruction so that we start after the FIRST instruction
    // has been executed ...
    else if (curTrace.length == 2) {
      curTrace.shift();
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
}

// relies on curTrace and curInstr globals
function updateOutput() {
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
      $("#errorOutput").html('Unknown error: <a id="editCodeLinkOnError" href="#">view code</a> and please<br/>email as a bug report to philip@pgbovine.net');
    }
    else {
      $("#errorOutput").html(htmlspecialchars(curEntry.exception_msg));
    }

    $("#editCodeLinkOnError").click(function() {
      $("#pyInputPane").show();
      $("#pyInputPane").css('border-bottom', '2px dashed #bbbbbb');
      return false; // to prevent page reload
    });

    $("#errorOutput").show();

    hasError = true;
  }
  else {
    $("#errorOutput").hide();
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
  $(vizDiv).html(''); // CLEAR IT!


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
          renderData(val, curTr.find("td.val"));
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
        renderData(val, curTr.find("td.val"));
      }
    });

    tbl.find("tr:last").find("td.varname").css('border-bottom', '0px');
    tbl.find("tr:last").find("td.val").css('border-bottom', '0px');
  }
  else {
    $(vizDiv + " .vizFrame:last").append(' <i>none</i>');
  }

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


  $(vizDiv).html(''); // CLEAR IT!

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
      $(vizDiv + " #stack").append('<div class="globalFrame" id="globals"><div id="globals_header" class="stackFrameHeader inactiveStackFrameHeader">Global variables</div></div>');

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
            renderData(val, curTr.find("td.stackFrameValue"));
          }
          else {
            // add a stub so that we can connect it with a connector later.
            // IE needs this div to be NON-EMPTY in order to properly
            // render jsPlumb endpoints, so that's why we add an "&nbsp;"!

            // TODO: make sure varname doesn't contain any weird
            // characters that are illegal for CSS ID's ...
            var varDivID = 'global__' + varname;
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
      var retvalIdx = orderedVarnames.indexOf('__return__');
      if (retvalIdx >= 0) {
        orderedVarnames.splice(retvalIdx, 1);
        orderedVarnames.push('__return__');
      }

      $.each(orderedVarnames, function(i, varname) {
        var val = localVars[varname];

        // special treatment for displaying return value and indicating
        // that the function is about to return to its caller
        if (varname == '__return__') {
          tbl.append('<tr><td class="stackFrameVar"><span class="retval">Return value:</span></td><td class="stackFrameValue"></td></tr>');
        }
        else {
          tbl.append('<tr><td class="stackFrameVar">' + varname + '</td><td class="stackFrameValue"></td></tr>');
        }

        var curTr = tbl.find('tr:last');

        // render primitives inline and compound types on the heap
        if (isPrimitiveType(val)) {
          renderData(val, curTr.find("td.stackFrameValue"));
        }
        else {
          // add a stub so that we can connect it with a connector later.
          // IE needs this div to be NON-EMPTY in order to properly
          // render jsPlumb endpoints, so that's why we add an "&nbsp;"!

          // TODO: make sure varname doesn't contain any weird
          // characters that are illegal for CSS ID's ...
          var varDivID = divID + '__' + varname;
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
      renderData(obj, $(vizDiv + ' #heap #' + heapObjID));

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
function renderData(obj, jDomElt) {
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

    if (obj[0] == 'LIST') {
      assert(obj.length >= 2);
      if (obj.length == 2) {
        jDomElt.append('<div class="typeLabel">empty list (id=' + obj[1] + ')</div>');
      }
      else {
        jDomElt.append('<div class="typeLabel">list (id=' + obj[1] + '):</div>');
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
          renderData(val, contentTr.find('td:last'));
        });
      }
    }
    else if (obj[0] == 'TUPLE') {
      assert(obj.length >= 2);
      if (obj.length == 2) {
        jDomElt.append('<div class="typeLabel">empty tuple (id=' + obj[1] + ')</div>');
      }
      else {
        jDomElt.append('<div class="typeLabel">tuple (id=' + obj[1] + '):</div>');
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
          renderData(val, contentTr.find('td:last'));
        });
      }
    }
    else if (obj[0] == 'SET') {
      assert(obj.length >= 2);
      if (obj.length == 2) {
        jDomElt.append('<div class="typeLabel">empty set (id=' + obj[1] + ')</div>');
      }
      else {
        jDomElt.append('<div class="typeLabel">set (id=' + obj[1] + '):</div>');
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
          renderData(val, curTr.find('td:last'));
        });
      }
    }
    else if (obj[0] == 'DICT') {
      assert(obj.length >= 2);
      if (obj.length == 2) {
        jDomElt.append('<div class="typeLabel">empty dict (id=' + obj[1] + ')</div>');
      }
      else {
        jDomElt.append('<div class="typeLabel">dict (id=' + obj[1] + '):</div>');
        jDomElt.append('<table class="dictTbl"></table>');
        var tbl = jDomElt.children('table');
        $.each(obj, function(ind, kvPair) {
          if (ind < 2) return; // skip 'DICT' tag and ID entry

          tbl.append('<tr class="dictEntry"><td class="dictKey"></td><td class="dictVal"></td></tr>');
          var newRow = tbl.find('tr:last');
          var keyTd = newRow.find('td:first');
          var valTd = newRow.find('td:last');
          renderData(kvPair[0], keyTd);
          renderData(kvPair[1], valTd);
        });
      }
    }
    else if (obj[0] == 'INSTANCE') {
      assert(obj.length >= 3);
      jDomElt.append('<div class="typeLabel">' + obj[1] + ' instance (id=' + obj[2] + ')</div>');

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
          renderData(kvPair[1], valTd);
        });
      }
    }
    else if (obj[0] == 'CLASS') {
      assert(obj.length >= 4);
      var superclassStr = '';
      if (obj[3].length > 0) {
        superclassStr += ('[extends ' + obj[3].join(',') + '] ');
      }

      jDomElt.append('<div class="typeLabel">' + obj[1] + ' class ' + superclassStr + '(id=' + obj[2] + ')</div>');

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
          renderData(kvPair[1], valTd);
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
        jDomElt.append('<span class="customObj">' + typeName + ' (id=' + id + ')</span>');
      }
      else {
        strRepr = htmlspecialchars(strRepr); // escape strings!

        // warning: we're overloading tuple elts for custom data types
        jDomElt.append('<div class="typeLabel">' + typeName + ' (id=' + id + '):</div>');
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
  tbl.html('');
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

$(document).ready(function() {

  $("#pyOutputPane").hide();

  $("#executeBtn").attr('disabled', false);

  $("#pyInput").tabby(); // recognize TAB and SHIFT-TAB

  // disable autogrow for simplicity
  //$("#pyInput").autogrow();

  $("#executeBtn").click(function() {
    if (localTesting) {
      renderPyCodeOutput($("#pyInput").val());

      processTrace(data_test_trace);

      $("#pyInputPane").hide();
      $("#pyOutputPane").show();
    }
    else {
      $('#executeBtn').html("Please wait ... processing your code");
      $('#executeBtn').attr('disabled', true);
      $("#pyOutputPane").hide();

      $.post("cgi-bin/web_exec.py",
             {user_script : $("#pyInput").val()},
             function(traceData) {
               renderPyCodeOutput($("#pyInput").val());
               processTrace(traceData);

              $("#pyInputPane").hide();
              $("#pyOutputPane").show();

              $('#executeBtn').html("Visualize execution");
              $('#executeBtn').attr('disabled', false);
             },
             "json");
    }
  });


  $("#editCodeLink").click(function() {
    $("#pyInputPane").show();
    $("#pyInputPane").css('border-bottom', '2px dashed #bbbbbb');
    updateOutput();
    return false; // to prevent page reload
  });


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


  // canned examples

  $("#tutorialExampleLink").click(function() {
    $.get("example-code/py_tutorial.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#strtokExampleLink").click(function() {
    $.get("example-code/strtok.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#fibonacciExampleLink").click(function() {
    $.get("example-code/fib.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#memoFibExampleLink").click(function() {
    $.get("example-code/memo_fib.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#factExampleLink").click(function() {
    $.get("example-code/fact.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#filterExampleLink").click(function() {
    $.get("example-code/filter.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#insSortExampleLink").click(function() {
    $.get("example-code/ins_sort.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#aliasExampleLink").click(function() {
    $.get("example-code/aliasing.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#newtonExampleLink").click(function() {
    $.get("example-code/sqrt.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#oopSmallExampleLink").click(function() {
    $.get("example-code/oop_small.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#mapExampleLink").click(function() {
    $.get("example-code/map.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#oop1ExampleLink").click(function() {
    $.get("example-code/oop_1.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#oop2ExampleLink").click(function() {
    $.get("example-code/oop_2.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#inheritanceExampleLink").click(function() {
    $.get("example-code/oop_inherit.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#sumExampleLink").click(function() {
    $.get("example-code/sum.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#pwGcdLink").click(function() {
    $.get("example-code/wentworth_gcd.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#pwSumListLink").click(function() {
    $.get("example-code/wentworth_sumList.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#towersOfHanoiLink").click(function() {
    $.get("example-code/towers_of_hanoi.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });

  $("#pwTryFinallyLink").click(function() {
    $.get("example-code/wentworth_try_finally.txt", function(dat) {$("#pyInput").val(dat);});
    return false;
  });


  // set some sensible jsPlumb defaults
  jsPlumb.Defaults.Endpoint = ["Dot", {radius:3}];
  //jsPlumb.Defaults.Endpoint = ["Rectangle", {width:3, height:3}];
  jsPlumb.Defaults.EndpointStyle = {fillStyle: lightGray};
  jsPlumb.Defaults.Anchors = ["RightMiddle", "LeftMiddle"];
  jsPlumb.Defaults.Connector = [ "Bezier", { curviness:15 }]; /* too much 'curviness' causes lines to run together */
  jsPlumb.Defaults.PaintStyle = {lineWidth:1, strokeStyle: lightGray};

  jsPlumb.Defaults.EndpointHoverStyle = {fillStyle: pinkish};
  jsPlumb.Defaults.HoverPaintStyle = {lineWidth:2, strokeStyle: pinkish};


  // select an example on start-up:
  $("#aliasExampleLink").trigger('click');


  // disable controls initially ...
  $("#vcrControls #jmpFirstInstr").attr("disabled", true);
  $("#vcrControls #jmpStepBack").attr("disabled", true);
  $("#vcrControls #jmpStepFwd").attr("disabled", true);
  $("#vcrControls #jmpLastInstr").attr("disabled", true);


  // set keyboard event listeners ...
  $(document).keydown(function(k) {
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
  });
});

