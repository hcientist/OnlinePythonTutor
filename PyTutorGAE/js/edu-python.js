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


// TODO: look into using the d3.map class instead of direct object operations in js,
// since the latter might exhibit funny behavior for certain reserved keywords


// code that is common to all Online Python Tutor pages

var appMode = 'edit'; // 'edit', 'visualize', or 'grade' (only for question.html)


/* colors - see edu-python.css */
var lightYellow = '#F5F798';
var lightLineColor = '#FFFFCC';
var errorColor = '#F87D76';
var visitedLineColor = '#3D58A2';

var lightGray = "#cccccc";
var darkBlue = "#3D58A2";
var medBlue = "#41507A";
var medLightBlue = "#6F89D1";
var lightBlue = "#899CD1";
var pinkish = "#F15149";
var lightPink = "#F89D99";
var darkRed = "#9D1E18";

var breakpointColor = pinkish;
var hoverBreakpointColor = medLightBlue;


var keyStuckDown = false;


// ugh globals! should really refactor into a "current state" object or
// something like that ...
var curTrace = null;
var curInputCode = null;
var curInstr = 0;

var preseededCode = null;     // if you passed in a 'code=<code string>' in the URL, then set this var
var preseededCurInstr = null; // if you passed in a 'curInstr=<number>' in the URL, then set this var


// an array of objects with the following fields:
//   'text' - the text of the line of code
//   'lineNumber' - one-indexed (always the array index + 1)
//   'executionPoints' - an ordered array of zero-indexed execution points where this line was executed
//   'backgroundColor' - current code output line background color
//   'breakpointHere' - has a breakpoint been set here?
var codeOutputLines = [];

var visitedLinesSet = {} // YUCKY GLOBAL!



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

function enterVisualizeMode(jumpToEnd) {
  curInstr = 0;

  // only do this at most ONCE, and then clear out preseededCurInstr
  if (preseededCurInstr && preseededCurInstr < curTrace.length) { // NOP anyways if preseededCurInstr is 0
    curInstr = preseededCurInstr;
    preseededCurInstr = null;
  }

  // delete all stale output
  $("#pyStdout").val('');

  if (curTrace.length > 0) {
    if (jumpToEnd) {
      // if there's an exception, then jump to the FIRST occurrence of
      // that exception. otherwise, jump to the very end of execution.
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


  // remove any existing sliders
  $('#executionSlider').slider('destroy');
  $('#executionSlider').empty();

  $('#executionSlider').slider({
    min: 0,
    max: curTrace.length - 1,
    step: 1,
  });

  //disable keyboard actions on the slider itself (to prevent double-firing of events)
  $("#executionSlider .ui-slider-handle").unbind('keydown');
  // make skinnier and taller
  $("#executionSlider .ui-slider-handle").css('width', '0.8em');
  $("#executionSlider .ui-slider-handle").css('height', '1.4em');

  $(".ui-widget-content").css('font-size', '0.9em');
 
  updateOutput();
}

function highlightCodeLine(curLine, hasError, isTerminated) {
  d3.selectAll('#pyCodeOutputDiv td.lineNo')
    .attr('id', function(d) {return 'lineNo' + d.lineNumber;})
    .style('color', function(d)
      {return d.breakpointHere ? breakpointColor : (visitedLinesSet[d.lineNumber] ? visitedLineColor : null);})
    .style('font-weight', function(d)
      {return d.breakpointHere ? 'bold' : (visitedLinesSet[d.lineNumber] ? 'bold' : null);});

  d3.selectAll('#pyCodeOutputDiv td.cod')
    .style('background-color', function(d) {
      if (d.lineNumber == curLine) {
        if (hasError) {
          d.backgroundColor = errorColor;
        }
        else if (isTerminated) {
          d.backgroundColor = lightBlue;
        }
        else {
          d.backgroundColor = lightLineColor;
        }
      }
      else {
        d.backgroundColor = null;
      }

      return d.backgroundColor;
    })
    .style('border-top', function(d) {
      if ((d.lineNumber == curLine) && !hasError && !isTerminated) {
        return '1px solid #F87D76';
      }
      else {
        // put a default white top border to keep space usage consistent
        return '1px solid #ffffff';
      }
    });

  // smoothly scroll code display
  if (!isOutputLineVisible(curLine)) {
    scrollCodeOutputToLine(curLine);
  }
}


// smoothly scroll pyCodeOutputDiv so that the given line is at the center
function scrollCodeOutputToLine(lineNo) {
  var lineNoTd = $('#lineNo' + lineNo);
  var LO = lineNoTd.offset().top;

  var codeOutputDiv = $('#pyCodeOutputDiv');
  var PO = codeOutputDiv.offset().top;
  var ST = codeOutputDiv.scrollTop();
  var H = codeOutputDiv.height();

  codeOutputDiv.animate({scrollTop: (ST + (LO - PO - (Math.round(H / 2))))}, 300);
}


// returns True iff lineNo is visible in pyCodeOutputDiv
function isOutputLineVisible(lineNo) {
  var lineNoTd = $('#lineNo' + lineNo);
  var LO = lineNoTd.offset().top;

  var codeOutputDiv = $('#pyCodeOutputDiv');
  var PO = codeOutputDiv.offset().top;
  var ST = codeOutputDiv.scrollTop();
  var H = codeOutputDiv.height();

  // add a few pixels of fudge factor on the bottom end due to bottom scrollbar
  return (PO <= LO) && (LO < (PO + H - 15));
}



// Pre-compute the layout of top-level heap objects for ALL execution
// points as soon as a trace is first loaded. The reason why we want to
// do this is so that when the user steps through execution points, the
// heap objects don't "jiggle around" (i.e., preserving positional
// invariance). Also, if we set up the layout objects properly, then we
// can take full advantage of d3 to perform rendering and transitions.


// curTraceLayouts is a list of top-level heap layout "objects" with the
// same length as curTrace after it's been fully initialized. Each
// element of curTraceLayouts is computed from the contents of its
// immediate predecessor, thus ensuring that objects don't "jiggle
// around" between consecutive execution points.
//
// Each top-level heap layout "object" is itself a LIST of LISTS of
// object IDs, where each element of the outer list represents a row,
// and each element of the inner list represents columns within a
// particular row. Each row can have a different number of columns. Most
// rows have exactly ONE column (representing ONE object ID), but rows
// containing 1-D linked data structures have multiple columns. Each
// inner list element looks something like ['row1', 3, 2, 1] where the
// first element is a unique row ID tag, which is used as a key for d3 to
// preserve "object constancy" for updates, transitions, etc. The row ID
// is derived from the FIRST object ID inserted into the row. Since all
// object IDs are unique, all row IDs will also be unique.
var curTraceLayouts = null;

/* This is a good, simple example to test whether objects "jiggle"

x = [1, [2, [3, None]]]
y = [4, [5, [6, None]]]

x[1][1] = y[1]

*/


function precomputeCurTraceLayouts() {
  curTraceLayouts = [];
  curTraceLayouts.push([]); // pre-seed with an empty sentinel to simplify the code

  assert(curTrace.length > 0);

 
  $.each(curTrace, function(i, curEntry) {
    var prevLayout = curTraceLayouts[curTraceLayouts.length - 1];

    // make a DEEP COPY of prevLayout to use as the basis for curLine
    var curLayout = $.extend(true /* deep copy */ , [], prevLayout);

    // initialize with all IDs from curLayout
    var idsToRemove = d3.map();
    $.each(curLayout, function(i, row) {
      for (var j = 1 /* ignore row ID tag */; j < row.length; j++) {
        idsToRemove.set(row[j], 1);
      }
    });

    var idsAlreadyLaidOut = d3.map(); // to prevent infinite recursion


    function curLayoutIndexOf(id) {
      for (var i = 0; i < curLayout.length; i++) {
        var row = curLayout[i];
        var index = row.indexOf(id);
        if (index > 0) { // index of 0 is impossible since it's the row ID tag
          return {row: row, index: index}
        }
      }
      return null;
    }


    function recurseIntoObject(id, curRow, newRow) {
      // heuristic for laying out 1-D linked data structures: check for enclosing elements that are
      // structurally identical and then lay them out as siblings in the same "row"
      var heapObj = curEntry.heap[id];
      assert(heapObj);

      if (heapObj[0] == 'LIST' || heapObj[0] == 'TUPLE') {
        $.each(heapObj, function(ind, child) {
          if (ind < 1) return; // skip type tag

          if (!isPrimitiveType(child)) {
            var childID = getRefID(child);
            if (structurallyEquivalent(heapObj, curEntry.heap[childID])) {
              if (!idsAlreadyLaidOut.has(childID)) { // TODO: awkward guard location
                updateCurLayout(childID, curRow, newRow);
              }
            }
          }
        });
      }
      else if (heapObj[0] == 'DICT') {
        $.each(heapObj, function(ind, child) {
          if (ind < 1) return; // skip type tag

          var dictVal = child[1];
          if (!isPrimitiveType(dictVal)) {
            var childID = getRefID(dictVal);
            if (structurallyEquivalent(heapObj, curEntry.heap[childID])) {
              if (!idsAlreadyLaidOut.has(childID)) { // TODO: awkward guard location
                updateCurLayout(childID, curRow, newRow);
              }
            }
          }
        });
      }
      else if (heapObj[0] == 'INSTANCE') {
        jQuery.each(heapObj, function(ind, child) {
          if (ind < 2) return; // skip type tag and class name

          // instance keys are always strings, so no need to recurse
          assert(typeof child[0] == "string");

          var instVal = child[1];
          if (!isPrimitiveType(instVal)) {
            var childID = getRefID(instVal);
            if (structurallyEquivalent(heapObj, curEntry.heap[childID])) {
              if (!idsAlreadyLaidOut.has(childID)) { // TODO: awkward guard location
                updateCurLayout(childID, curRow, newRow);
              }
            }
          }
        });
      }
    }


    // a krazy function!
    // id     - the new object ID to be inserted somewhere in curLayout
    //          (if it's not already in there)
    // curRow - a row within curLayout where new linked list
    //          elements can be appended onto (might be null)
    // newRow - a new row that might be spliced into curRow or appended
    //          as a new row in curLayout
    function updateCurLayout(id, curRow, newRow) {
      var curLayoutLoc = curLayoutIndexOf(id);

      console.log('updateCurLayout', id, curRow, newRow, curLayoutLoc);

      var alreadyLaidOut = idsAlreadyLaidOut.has(id);
      idsAlreadyLaidOut.set(id, 1); // unconditionally set now

      // if id is already in curLayout ...
      if (curLayoutLoc) {
        var foundRow = curLayoutLoc.row;
        var foundIndex = curLayoutLoc.index;

        idsToRemove.remove(id); // this id is already accounted for!

        // very subtle ... if id hasn't already been handled in
        // this iteration, then splice newRow into foundRow. otherwise
        // (later) append newRow onto curLayout as a truly new row
        if (!alreadyLaidOut) {
          // splice the contents of newRow right BEFORE foundIndex.
          // (Think about when you're trying to insert in id=3 into ['row1', 2, 1]
          //  to represent a linked list 3->2->1. You want to splice the 3
          //  entry right before the 2 to form ['row1', 3, 2, 1])
          if (newRow.length > 1) {
            var args = [foundIndex, 0];
            for (var i = 1; i < newRow.length; i++) { // ignore row ID tag
              args.push(newRow[i]);
              idsToRemove.remove(newRow[i]);
            }
            foundRow.splice.apply(foundRow, args);

            // remove ALL elements from newRow since they've all been accounted for
            // (but don't reassign it away to an empty list, since the
            // CALLER checks its value. TODO: how to get rid of this gross hack?!?)
            newRow.splice(0, newRow.length);
          }
        }

        // recurse to find more top-level linked entries to append onto foundRow
        recurseIntoObject(id, foundRow, []);
      }
      else {
        // push id into newRow ...
        if (newRow.length == 0) {
          newRow.push('row' + id); // unique row ID (since IDs are unique)
        }
        newRow.push(id);

        // recurse to find more top-level linked entries ...
        recurseIntoObject(id, curRow, newRow);


        // if newRow hasn't been spliced into an existing row yet during
        // a child recursive call ...
        if (newRow.length > 0) {
          if (curRow && curRow.length > 0) {
            // append onto the END of curRow if it exists
            for (var i = 1; i < newRow.length; i++) { // ignore row ID tag
              curRow.push(newRow[i]);
            }
          }
          else {
            // otherwise push to curLayout as a new row
            //
            // TODO: this might not always look the best, since we might
            // sometimes want to splice newRow in the MIDDLE of
            // curLayout. Consider this example:
            //
            // x = [1,2,3]
            // y = [4,5,6]
            // x = [7,8,9]
            //
            // when the third line is executed, the arrows for x and y
            // will be crossed (ugly!) since the new row for the [7,8,9]
            // object is pushed to the end (bottom) of curLayout. The
            // proper behavior is to push it to the beginning of
            // curLayout where the old row for 'x' used to be.
            curLayout.push($.extend(true /* make a deep copy */ , [], newRow));
          }

          // regardless, newRow is now accounted for, so clear it
          for (var i = 1; i < newRow.length; i++) { // ignore row ID tag
            idsToRemove.remove(newRow[i]);
          }
          newRow.splice(0, newRow.length); // kill it!
        }

      }
    }

    console.log('BEG precomputeCurTraceLayouts', i);


    // iterate through all globals and ordered stack frames and call updateCurLayout
    $.each(curEntry.ordered_globals, function(i, varname) {
      var val = curEntry.globals[varname];
      if (val !== undefined) { // might not be defined at this line, which is OKAY!
        if (!isPrimitiveType(val)) {
          var id = getRefID(val);
          updateCurLayout(id, null, []);
        }
      }
    });

    $.each(curEntry.stack_to_render, function(i, frame) {
      $.each(frame.ordered_varnames, function(xxx, varname) {
        var val = frame.encoded_locals[varname];

        if (!isPrimitiveType(val)) {
          var id = getRefID(val);
          updateCurLayout(id, null, []);
        }
      });
    });


    // iterate through remaining elements of idsToRemove and REMOVE them from curLayout
    idsToRemove.forEach(function(id, xxx) {
      id = Number(id); // keys are stored as strings, so convert!!!
      $.each(curLayout, function(rownum, row) {
        var ind = row.indexOf(id);
        if (ind > 0) { // remember that index 0 of the row is the row ID tag
          row.splice(ind, 1);
        }
      });
    });

    // now remove empty rows (i.e., those with only a row ID tag) from curLayout
    curLayout = curLayout.filter(function(row) {return row.length > 1});

    curTraceLayouts.push(curLayout);
    console.log('END precomputeCurTraceLayouts', i);
    idsToRemove.forEach(function (id, xxx) {console.log('  idsToRemove:', id);});
  });

  curTraceLayouts.splice(0, 1); // remove seeded empty sentinel element
  assert (curTrace.length == curTraceLayouts.length);
}


// relies on curTrace and curInstr globals
function updateOutput() {
  if (!curTrace) {
    return;
  }

  $('#urlOutput').val(''); // blank out

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
    $("#vcrControls #curInstr").html("About to run step " + (curInstr + 1) + " of " + (totalInstrs-1));
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




  // PROGRAMMATICALLY change the value, so evt.originalEvent should be undefined
  $('#executionSlider').slider('value', curInstr);


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
    visitedLinesSet = {} // GLOBAL!
    for (var i = 0; i < curInstr; i++) {
      if (curTrace[i].line) {
        visitedLinesSet[curTrace[i].line] = true;
      }
    }

    highlightCodeLine(curEntry.line, hasError,
                      /* if instrLimitReached, then treat like a normal non-terminating line */
                      (!instrLimitReached && (curInstr == (totalInstrs-1))));
  }


  // render stdout:

  // keep original horizontal scroll level:
  var oldLeft = $("#pyStdout").scrollLeft();
  $("#pyStdout").val(curEntry.stdout);

  $("#pyStdout").scrollLeft(oldLeft);
  // scroll to bottom, though:
  $("#pyStdout").scrollTop($("#pyStdout")[0].scrollHeight);


  // finally, render all the data structures!!!
  renderDataStructures(curEntry, "#dataViz");
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


// compare two JSON-encoded compound objects for structural equivalence:
function structurallyEquivalent(obj1, obj2) {
  // punt if either isn't a compound type
  if (isPrimitiveType(obj1) || isPrimitiveType(obj2)) {
    return false;
  }

  // must be the same compound type
  if (obj1[0] != obj2[0]) {
    return false;
  }

  // must have the same number of elements or fields
  if (obj1.length != obj2.length) {
    return false;
  }

  // for a list or tuple, same size (e.g., a cons cell is a list/tuple of size 2)
  if (obj1[0] == 'LIST' || obj1[0] == 'TUPLE') {
    return true;
  }
  else {
    var startingInd = -1;

    if (obj1[0] == 'DICT') {
      startingInd = 2;
    }
    else if (obj1[0] == 'INSTANCE') {
      startingInd = 3;
    }
    else {
      return false;
    }

    var obj1fields = {};

    // for a dict or object instance, same names of fields (ordering doesn't matter)
    for (var i = startingInd; i < obj1.length; i++) {
      obj1fields[obj1[i][0]] = 1; // use as a set
    }

    for (var i = startingInd; i < obj2.length; i++) {
      if (obj1fields[obj2[i][0]] == undefined) {
        return false;
      }
    }

    return true;
  }
}



// Renders the current trace entry (curEntry) into the div named by vizDiv
//
// The "3.0" version of renderDataStructures renders variables in
// a stack, values in a separate heap, and draws line connectors
// to represent both stack->heap object references and, more importantly,
// heap->heap references. This version was created in August 2012.
//
// The "2.0" version of renderDataStructures renders variables in
// a stack and values in a separate heap, with data structure aliasing
// explicitly represented via line connectors (thanks to jsPlumb lib).
// This version was created in September 2011.
//
// The ORIGINAL "1.0" version of renderDataStructures
// was created in January 2010 and rendered variables and values
// INLINE within each stack frame without any explicit representation
// of data structure aliasing. That is, aliased objects were rendered
// multiple times, and a unique ID label was used to identify aliases.
function renderDataStructures(curEntry, vizDiv) {

  // VERY VERY IMPORTANT --- and reset ALL jsPlumb state to prevent
  // weird mis-behavior!!!
  jsPlumb.reset();

  $(vizDiv).empty(); // jQuery empty() is better than .html('')


  // create a tabular layout for stack and heap side-by-side
  // TODO: figure out how to do this using CSS in a robust way!
  $(vizDiv).html('<table id="stackHeapTable"><tr><td id="stack_td"><div id="stack"></div></td><td id="heap_td"><div id="heap"></div></td></tr></table>');

  $(vizDiv + " #stack").append('<div id="stackHeader">Frames</div>');



  // Heap object rendering phase:



  // VERY VERY experimental!!!
  // when doing this for realz, convert to using d3 and use row ID tag
  // as unique object ID for object constancy.
  var curEntryLayout = curTraceLayouts[curInstr];

  var toplevelHeapLayout = curEntryLayout.map(function(row) {
    return row.slice(1, row.length); // KRAZY!!! remove row ID tag for now
  });



  // Key:   CSS ID of the div element representing the stack frame variable
  //        (for stack->heap connections) or heap object (for heap->heap connections)
  //        the format is: 'heap_pointer_src_<src id>'
  // Value: CSS ID of the div element representing the value rendered in the heap
  //        (the format is: 'heap_object_<id>')
  var connectionEndpointIDs = {};
  var heapConnectionEndpointIDs = {}; // subset of connectionEndpointIDs for heap->heap connections

  var heap_pointer_src_id = 1; // increment this to be unique for each heap_pointer_src_*


  var renderedObjectIDs = d3.map();

  // count everything in toplevelHeapLayout as already rendered since we will render them
  // in the d3 .each() statement labeled 'FOOBAR' (might be confusing!)
  $.each(toplevelHeapLayout, function(xxx, row) {
    for (var i = 0; i < row.length; i++) {
      renderedObjectIDs.set(row[i], 1);
    }
  });


  // render the heap by mapping toplevelHeapLayout into <table class="heapRow"> and <td class="toplevelHeapObject"> elements using d3
  d3.select(vizDiv + ' #heap')
    .selectAll('table')
    .data(toplevelHeapLayout)
    .enter().append('table')
    .attr('class', 'heapRow')
    .selectAll('td')
    .data(function(d, i) {return d;}) // map over each row ...
    .enter().append('td')
    .attr('class', 'toplevelHeapObject')
    .attr('id', function(d, i) {return 'toplevel_heap_object_' + d;})
    .each(function(objID, i) {
      renderCompoundObject(objID, $(this), true); // label FOOBAR (see renderedObjectIDs)
    });


  function renderNestedObject(obj, d3DomElement) {
    if (isPrimitiveType(obj)) {
      renderPrimitiveObject(obj, d3DomElement);
    }
    else {
      renderCompoundObject(getRefID(obj), d3DomElement, false);
    }
  }


  function renderPrimitiveObject(obj, d3DomElement) {
    var typ = typeof obj;

    if (obj == null) {
      d3DomElement.append('<span class="nullObj">None</span>');
    }
    else if (typ == "number") {
      d3DomElement.append('<span class="numberObj">' + obj + '</span>');
    }
    else if (typ == "boolean") {
      if (obj) {
        d3DomElement.append('<span class="boolObj">True</span>');
      }
      else {
        d3DomElement.append('<span class="boolObj">False</span>');
      }
    }
    else if (typ == "string") {
      // escape using htmlspecialchars to prevent HTML/script injection
      var literalStr = htmlspecialchars(obj);

      // print as a double-quoted string literal
      literalStr = literalStr.replace(new RegExp('\"', 'g'), '\\"'); // replace ALL
      literalStr = '"' + literalStr + '"';

      d3DomElement.append('<span class="stringObj">' + literalStr + '</span>');
    }
    else {
      assert(false);
    }
  }


  function renderCompoundObject(objID, d3DomElement, isTopLevel) {
    if (!isTopLevel && renderedObjectIDs.has(objID)) {
      // render jsPlumb arrow source since this heap object has already been rendered
      // (or will be rendered soon)

      // add a stub so that we can connect it with a connector later.
      // IE needs this div to be NON-EMPTY in order to properly
      // render jsPlumb endpoints, so that's why we add an "&nbsp;"!

      var srcDivID = 'heap_pointer_src_' + heap_pointer_src_id;
      heap_pointer_src_id++; // just make sure each source has a UNIQUE ID
      d3DomElement.append('<div id="' + srcDivID + '">&nbsp;</div>');

      assert(connectionEndpointIDs[srcDivID] === undefined);
      connectionEndpointIDs[srcDivID] = 'heap_object_' + objID;

      assert(heapConnectionEndpointIDs[srcDivID] === undefined);
      heapConnectionEndpointIDs[srcDivID] = 'heap_object_' + objID;

      return; // early return!
    }


    // wrap ALL compound objects in a heapObject div so that jsPlumb
    // connectors can point to it:
    d3DomElement.append('<div class="heapObject" id="heap_object_' + objID + '"></div>');
    d3DomElement = $('#heap_object_' + objID);


    renderedObjectIDs.set(objID, 1);

    var obj = curEntry.heap[objID];
    assert($.isArray(obj));


    if (obj[0] == 'LIST' || obj[0] == 'TUPLE' || obj[0] == 'SET' || obj[0] == 'DICT') {
      var label = obj[0].toLowerCase();

      assert(obj.length >= 1);
      if (obj.length == 1) {
        d3DomElement.append('<div class="typeLabel">empty ' + label + '</div>');
      }
      else {
        d3DomElement.append('<div class="typeLabel">' + label + '</div>');
        d3DomElement.append('<table class="' + label + 'Tbl"></table>');
        var tbl = d3DomElement.children('table');

        if (obj[0] == 'LIST' || obj[0] == 'TUPLE') {
          tbl.append('<tr></tr><tr></tr>');
          var headerTr = tbl.find('tr:first');
          var contentTr = tbl.find('tr:last');
          $.each(obj, function(ind, val) {
            if (ind < 1) return; // skip type tag and ID entry

            // add a new column and then pass in that newly-added column
            // as d3DomElement to the recursive call to child:
            headerTr.append('<td class="' + label + 'Header"></td>');
            headerTr.find('td:last').append(ind - 1);

            contentTr.append('<td class="'+ label + 'Elt"></td>');
            renderNestedObject(val, contentTr.find('td:last'));
          });
        }
        else if (obj[0] == 'SET') {
          // create an R x C matrix:
          var numElts = obj.length - 1;

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
            if (ind < 1) return; // skip 'SET' tag

            if (((ind - 1) % numCols) == 0) {
              tbl.append('<tr></tr>');
            }

            var curTr = tbl.find('tr:last');
            curTr.append('<td class="setElt"></td>');
            renderNestedObject(val, curTr.find('td:last'));
          });
        }
        else if (obj[0] == 'DICT') {
          $.each(obj, function(ind, kvPair) {
            if (ind < 1) return; // skip 'DICT' tag

            tbl.append('<tr class="dictEntry"><td class="dictKey"></td><td class="dictVal"></td></tr>');
            var newRow = tbl.find('tr:last');
            var keyTd = newRow.find('td:first');
            var valTd = newRow.find('td:last');

            var key = kvPair[0];
            var val = kvPair[1];

            renderNestedObject(key, keyTd);
            renderNestedObject(val, valTd);
          });
        }
      }
    }
    else if (obj[0] == 'INSTANCE' || obj[0] == 'CLASS') {
      var isInstance = (obj[0] == 'INSTANCE');
      var headerLength = isInstance ? 2 : 3;

      assert(obj.length >= headerLength);

      if (isInstance) {
        d3DomElement.append('<div class="typeLabel">' + obj[1] + ' instance</div>');
      }
      else {
        var superclassStr = '';
        if (obj[2].length > 0) {
          superclassStr += ('[extends ' + obj[2].join(', ') + '] ');
        }
        d3DomElement.append('<div class="typeLabel">' + obj[1] + ' class ' + superclassStr + '</div>');
      }

      if (obj.length > headerLength) {
        var lab = isInstance ? 'inst' : 'class';
        d3DomElement.append('<table class="' + lab + 'Tbl"></table>');

        var tbl = d3DomElement.children('table');

        $.each(obj, function(ind, kvPair) {
          if (ind < headerLength) return; // skip header tags

          tbl.append('<tr class="' + lab + 'Entry"><td class="' + lab + 'Key"></td><td class="' + lab + 'Val"></td></tr>');

          var newRow = tbl.find('tr:last');
          var keyTd = newRow.find('td:first');
          var valTd = newRow.find('td:last');

          // the keys should always be strings, so render them directly (and without quotes):
          assert(typeof kvPair[0] == "string");
          var attrnameStr = htmlspecialchars(kvPair[0]);
          keyTd.append('<span class="keyObj">' + attrnameStr + '</span>');

          // values can be arbitrary objects, so recurse:
          renderNestedObject(kvPair[1], valTd);
        });
      }
    }
    else if (obj[0] == 'FUNCTION') {
      assert(obj.length == 3);

      var funcName = htmlspecialchars(obj[1]); // for displaying weird names like '<lambda>'
      var parentFrameID = obj[2]; // optional

      if (parentFrameID) {
        d3DomElement.append('<div class="funcObj">function ' + funcName + ' [parent=f'+ parentFrameID + ']</div>');
      }
      else {
        d3DomElement.append('<div class="funcObj">function ' + funcName + '</div>');
      }
    }
    else {
      // render custom data type
      assert(obj.length == 2);

      var typeName = obj[0];
      var strRepr = obj[1];

      strRepr = htmlspecialchars(strRepr); // escape strings!

      d3DomElement.append('<div class="typeLabel">' + typeName + '</div>');
      d3DomElement.append('<table class="customObjTbl"><tr><td class="customObjElt">' + strRepr + '</td></tr></table>');
    }
  }


  // prepend heap header after all the dust settles:
  $(vizDiv + ' #heap').prepend('<div id="heapHeader">Objects</div>');



  // Render globals and then stack frames:
  // TODO: could convert to using d3 to map globals and stack frames directly into stack frame divs
  // (which might make it easier to do smooth transitions)

  // render all global variables IN THE ORDER they were created by the program,
  // in order to ensure continuity:
  if (curEntry.ordered_globals.length > 0) {
    $(vizDiv + " #stack").append('<div class="stackFrame" id="globals"><div id="globals_header" class="stackFrameHeader">Global variables</div></div>');
    $(vizDiv + " #stack #globals").append('<table class="stackFrameVarTable" id="global_table"></table>');

    var tbl = $(vizDiv + " #global_table");

    $.each(curEntry.ordered_globals, function(i, varname) {
      var val = curEntry.globals[varname];
      // (use '!==' to do an EXACT match against undefined)
      if (val !== undefined) { // might not be defined at this line, which is OKAY!
        tbl.append('<tr><td class="stackFrameVar">' + varname + '</td><td class="stackFrameValue"></td></tr>');
        var curTr = tbl.find('tr:last');

        if (isPrimitiveType(val)) {
          renderPrimitiveObject(val, curTr.find("td.stackFrameValue"));
        }
        else{
          // add a stub so that we can connect it with a connector later.
          // IE needs this div to be NON-EMPTY in order to properly
          // render jsPlumb endpoints, so that's why we add an "&nbsp;"!

          // make sure varname doesn't contain any weird
          // characters that are illegal for CSS ID's ...
          var varDivID = 'global__' + varnameToCssID(varname);
          curTr.find("td.stackFrameValue").append('<div id="' + varDivID + '">&nbsp;</div>');

          assert(connectionEndpointIDs[varDivID] === undefined);
          var heapObjID = 'heap_object_' + getRefID(val);
          connectionEndpointIDs[varDivID] = heapObjID;
        }
      }
    });
  }


  $.each(curEntry.stack_to_render, function(i, e) {
    renderStackFrame(e, i, e.is_zombie);
  });


  function renderStackFrame(frame, ind, is_zombie) {
    var funcName = htmlspecialchars(frame.func_name); // might contain '<' or '>' for weird names like <genexpr>
    var frameID = frame.frame_id; // optional (btw, this isn't a CSS id)

    // optional (btw, this isn't a CSS id)
    var parentFrameID = null;
    if (frame.parent_frame_id_list.length > 0) {
      parentFrameID = frame.parent_frame_id_list[0];
    }

    var localVars = frame.encoded_locals

    // the stackFrame div's id is simply its index ("stack<index>")

    var divClass, divID, headerDivID;
    if (is_zombie) {
      divClass = 'zombieStackFrame';
      divID = "zombie_stack" + ind;
      headerDivID = "zombie_stack_header" + ind;
    }
    else {
      divClass = 'stackFrame';
      divID = "stack" + ind;
      headerDivID = "stack_header" + ind;
    }

    $(vizDiv + " #stack").append('<div class="' + divClass + '" id="' + divID + '"></div>');

    var headerLabel = funcName + '()';
    if (frameID) {
      headerLabel = 'f' + frameID + ': ' + headerLabel;
    }
    if (parentFrameID) {
      headerLabel = headerLabel + ' [parent=f' + parentFrameID + ']';
    }
    $(vizDiv + " #stack #" + divID).append('<div id="' + headerDivID + '" class="stackFrameHeader">' + headerLabel + '</div>');

    if (frame.ordered_varnames.length > 0) {
      var tableID = divID + '_table';
      $(vizDiv + " #stack #" + divID).append('<table class="stackFrameVarTable" id="' + tableID + '"></table>');

      var tbl = $(vizDiv + " #" + tableID);

      $.each(frame.ordered_varnames, function(xxx, varname) {
        var val = localVars[varname];

        // special treatment for displaying return value and indicating
        // that the function is about to return to its caller
        //
        // DON'T do this for zombie frames
        if (varname == '__return__' && !is_zombie) {
          assert(curEntry.event == 'return'); // sanity check

          tbl.append('<tr><td colspan="2" class="returnWarning">About to return</td></tr>');
          tbl.append('<tr><td class="stackFrameVar"><span class="retval">Return value:</span></td><td class="stackFrameValue"></td></tr>');
        }
        else {
          tbl.append('<tr><td class="stackFrameVar">' + varname + '</td><td class="stackFrameValue"></td></tr>');
        }

        var curTr = tbl.find('tr:last');

        if (isPrimitiveType(val)) {
          renderPrimitiveObject(val, curTr.find("td.stackFrameValue"));
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


  // finally add all the connectors!
  for (varID in connectionEndpointIDs) {
    var valueID = connectionEndpointIDs[varID];
    jsPlumb.connect({source: varID, target: valueID});
  }


  function highlight_frame(frameID) {
    var allConnections = jsPlumb.getConnections();
    for (var i = 0; i < allConnections.length; i++) {
      var c = allConnections[i];

      // this is VERY VERY fragile code, since it assumes that going up
      // five layers of parent() calls will get you from the source end
      // of the connector to the enclosing stack frame
      var stackFrameDiv = c.source.parent().parent().parent().parent().parent();

      // if this connector starts in the selected stack frame ...
      if (stackFrameDiv.attr('id') == frameID) {
        // then HIGHLIGHT IT!
        c.setPaintStyle({lineWidth:1, strokeStyle: darkBlue});
        c.endpoints[0].setPaintStyle({fillStyle: darkBlue});
        c.endpoints[1].setVisible(false, true, true); // JUST set right endpoint to be invisible

        // ... and move it to the VERY FRONT
        $(c.canvas).css("z-index", 1000);
      }
      // for heap->heap connectors
      else if (heapConnectionEndpointIDs[c.endpoints[0].elementId] !== undefined) {
        // then HIGHLIGHT IT!
        c.setPaintStyle({lineWidth:1, strokeStyle: darkBlue}); // make thinner
        c.endpoints[0].setPaintStyle({fillStyle: darkBlue});
        c.endpoints[1].setVisible(false, true, true); // JUST set right endpoint to be invisible
        //c.setConnector([ "Bezier", {curviness: 80} ]); // make it more curvy
        c.setConnector([ "StateMachine" ]);
        c.addOverlay([ "Arrow", { length: 10, width:7, foldback:0.55, location:1 }]);
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
    $(".stackFrame").removeClass("highlightedStackFrame");
    $('#' + frameID).addClass("highlightedStackFrame");
  }


  // highlight the top-most non-zombie stack frame or, if not available, globals
  var frame_already_highlighted = false;
  $.each(curEntry.stack_to_render, function(i, e) {
    if (e.is_highlighted) {
      highlight_frame('stack' + i);
      frame_already_highlighted = true;
    }
  });

  if (!frame_already_highlighted) {
    highlight_frame('globals');
  }

}


function isPrimitiveType(obj) {
  var typ = typeof obj;
  return ((obj == null) || (typ != "object"));
}

function getRefID(obj) {
  assert(obj[0] == 'REF');
  return obj[1];
}

/*
function renderInline(obj) {
  return isPrimitiveType(obj) && (typeof obj != 'string');
}
*/

// Key is a primitive value (e.g., 'hello', 3.14159, true)
// Value is a unique primitive ID (starting with 'p' to disambiguate
// from regular object IDs)
var primitive_IDs = {null: 'p0', true: 'p1', false: 'p2'};
var cur_pID = 3;

function getObjectID(obj) {
  if (isPrimitiveType(obj)) {
    // primitive objects get IDs starting with 'p' ...
    // this renders aliases as 'interned' for simplicity
    var pID = primitive_IDs[obj];
    if (pID !== undefined) {
      return pID;
    }
    else {
      var new_pID = 'p' + cur_pID;
      primitive_IDs[obj] = new_pID;
      cur_pID++;
      return new_pID;
    }
    return obj;
  }
  else {
    assert($.isArray(obj));

    if ((obj[0] == 'INSTANCE') || (obj[0] == 'CLASS')) {
      return obj[2];
    }
    else {
      return obj[1];
    }
  }
}



String.prototype.rtrim = function() {
  return this.replace(/\s*$/g, "");
}


function renderPyCodeOutput(codeStr) {
  clearSliderBreakpoints(); // start fresh!

  var lines = codeStr.rtrim().split('\n');

  // reset it!
  codeOutputLines = [];
  $.each(lines, function(i, cod) {
    var n = {};
    n.text = cod;
    n.lineNumber = i + 1;
    n.executionPoints = [];
    n.backgroundColor = null;
    n.breakpointHere = false;


    $.each(curTrace, function(i, elt) {
      if (elt.line == n.lineNumber) {
        n.executionPoints.push(i);
      }
    });


    // if there is a comment containing 'breakpoint' and this line was actually executed,
    // then set a breakpoint on this line
    var breakpointInComment = false;
    toks = cod.split('#');
    for (var j = 1 /* start at index 1, not 0 */; j < toks.length; j++) {
      if (toks[j].indexOf('breakpoint') != -1) {
        breakpointInComment = true;
      }
    }

    if (breakpointInComment && n.executionPoints.length > 0) {
      n.breakpointHere = true;
      addToBreakpoints(n.executionPoints);
    }

    codeOutputLines.push(n);
  });


  $("#pyCodeOutputDiv").empty(); // jQuery empty() is better than .html('')


  // maps codeOutputLines to both table columns
  d3.select('#pyCodeOutputDiv')
    .append('table')
    .attr('id', 'pyCodeOutput')
    .selectAll('tr')
    .data(codeOutputLines)
    .enter().append('tr')
    .selectAll('td')
    .data(function(e, i){return [e, e];}) // bind an alias of the element to both table columns
    .enter().append('td')
    .attr('class', function(d, i) {return (i == 0) ? 'lineNo' : 'cod';})
    .style('cursor', function(d, i) {return 'pointer'})
    .html(function(d, i) {
      if (i == 0) {
        return d.lineNumber;
      }
      else {
        return htmlspecialchars(d.text);
      }
     })
    .on('mouseover', function() {
      setHoverBreakpoint(this);
     })
    .on('mouseout', function() {
      hoverBreakpoints = {};

      var breakpointHere = d3.select(this).datum().breakpointHere;

      if (!breakpointHere) {
        unsetBreakpoint(this);
      }

      renderSliderBreakpoints(); // get rid of hover breakpoint colors
     })
    .on('mousedown', function() {
      // don't do anything if exePts is empty
      // (i.e., this line was never executed)
      var exePts = d3.select(this).datum().executionPoints;
      if (!exePts || exePts.length == 0) {
        return;
      }

      // toggle breakpoint
      d3.select(this).datum().breakpointHere = !d3.select(this).datum().breakpointHere;

      var breakpointHere = d3.select(this).datum().breakpointHere;
      if (breakpointHere) {
        setBreakpoint(this);
      }
      else {
        unsetBreakpoint(this);
      }
     });

  renderSliderBreakpoints(); // renders breakpoints written in as code comments
}



var breakpoints = {}; // set of execution points to set as breakpoints
var sortedBreakpointsList = []; // sorted and synced with breakpointLines
var hoverBreakpoints = {}; // set of breakpoints because we're HOVERING over a given line


function _getSortedBreakpointsList() {
  var ret = [];
  for (var k in breakpoints) {
    ret.push(Number(k)); // these should be NUMBERS, not strings
  }
  ret.sort(function(x,y){return x-y}); // WTF, javascript sort is lexicographic by default!
  return ret;
}

function addToBreakpoints(executionPoints) {
  $.each(executionPoints, function(i, e) {
    breakpoints[e] = 1;
  });

  sortedBreakpointsList = _getSortedBreakpointsList();
}

function removeFromBreakpoints(executionPoints) {
  $.each(executionPoints, function(i, e) {
    delete breakpoints[e];
  });

  sortedBreakpointsList = _getSortedBreakpointsList();
}

// find the previous/next breakpoint to c or return -1 if it doesn't exist
function findPrevBreakpoint(c) {
  if (sortedBreakpointsList.length == 0) {
    return -1;
  }
  else {
    for (var i = 1; i < sortedBreakpointsList.length; i++) {
      var prev = sortedBreakpointsList[i-1];
      var cur = sortedBreakpointsList[i];

      if (c <= prev) {
        return -1;
      }

      if (cur >= c) {
        return prev;
      }
    }

    // final edge case:
    var lastElt = sortedBreakpointsList[sortedBreakpointsList.length - 1];
    return (lastElt < c) ? lastElt : -1;
  }
}

function findNextBreakpoint(c) {
  if (sortedBreakpointsList.length == 0) {
    return -1;
  }
  else {
    for (var i = 0; i < sortedBreakpointsList.length - 1; i++) {
      var cur = sortedBreakpointsList[i];
      var next = sortedBreakpointsList[i+1];

      if (c < cur) {
        return cur;
      }

      if (cur <= c && c < next) { // subtle
        return next;
      }
    }

    // final edge case:
    var lastElt = sortedBreakpointsList[sortedBreakpointsList.length - 1];
    return (lastElt > c) ? lastElt : -1;
  }
}


function setHoverBreakpoint(t) {
  var exePts = d3.select(t).datum().executionPoints;

  // don't do anything if exePts is empty
  // (i.e., this line was never executed)
  if (!exePts || exePts.length == 0) {
    return;
  }

  hoverBreakpoints = {};
  $.each(exePts, function(i, e) {
    hoverBreakpoints[e] = 1;
  });

  addToBreakpoints(exePts);
  renderSliderBreakpoints();
}


function setBreakpoint(t) {
  var exePts = d3.select(t).datum().executionPoints;

  // don't do anything if exePts is empty
  // (i.e., this line was never executed)
  if (!exePts || exePts.length == 0) {
    return;
  }

  addToBreakpoints(exePts);

  d3.select(t.parentNode).select('td.lineNo').style('color', breakpointColor);
  d3.select(t.parentNode).select('td.lineNo').style('font-weight', 'bold');

  renderSliderBreakpoints();
}

function unsetBreakpoint(t) {
  var exePts = d3.select(t).datum().executionPoints;

  // don't do anything if exePts is empty
  // (i.e., this line was never executed)
  if (!exePts || exePts.length == 0) {
    return;
  }

  removeFromBreakpoints(exePts);


  var lineNo = d3.select(t).datum().lineNumber;

  if (visitedLinesSet[lineNo]) {
    d3.select(t.parentNode).select('td.lineNo').style('color', visitedLineColor);
    d3.select(t.parentNode).select('td.lineNo').style('font-weight', 'bold');
  }
  else {
    d3.select(t.parentNode).select('td.lineNo').style('color', '');
    d3.select(t.parentNode).select('td.lineNo').style('font-weight', '');
  }

  renderSliderBreakpoints();
}


// depends on sortedBreakpointsList global
function renderSliderBreakpoints() {
  $("#executionSliderFooter").empty(); // jQuery empty() is better than .html('')

  // I originally didn't want to delete and re-create this overlay every time,
  // but if I don't do so, there are weird flickering artifacts with clearing
  // the SVG container; so it's best to just delete and re-create the container each time
  var sliderOverlay = d3.select('#executionSliderFooter')
    .append('svg')
    .attr('id', 'sliderOverlay')
    .attr('width', $('#executionSlider').width())
    .attr('height', 12);

  var xrange = d3.scale.linear()
    .domain([0, curTrace.length - 1])
    .range([0, $('#executionSlider').width()]);

  sliderOverlay.selectAll('rect')
      .data(sortedBreakpointsList)
    .enter().append('rect')
      .attr('x', function(d, i) {
        // make the edge cases look decent
        if (d == 0) {
          return 0;
        }
        else {
          return xrange(d) - 3;
        }
      })
      .attr('y', 0)
      .attr('width', 2)
      .attr('height', 12)
      .style('fill', function(d) {
         if (hoverBreakpoints[d] === undefined) {
           return breakpointColor;
         }
         else {
           return hoverBreakpointColor;
         }
       });
}


function clearSliderBreakpoints() {
  breakpoints = {};
  sortedBreakpointsList = [];
  hoverBreakpoints = {};
  renderSliderBreakpoints();
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

  jsPlumb.Defaults.Anchors = ["RightMiddle", "LeftMiddle"]; // for aesthetics!

  jsPlumb.Defaults.PaintStyle = {lineWidth:1, strokeStyle: lightGray};

  // bezier curve style:
  //jsPlumb.Defaults.Connector = [ "Bezier", { curviness:15 }]; /* too much 'curviness' causes lines to run together */
  //jsPlumb.Defaults.Overlays = [[ "Arrow", { length: 14, width:10, foldback:0.55, location:0.35 }]]

  // state machine curve style:
  jsPlumb.Defaults.Connector = [ "StateMachine" ];
  jsPlumb.Defaults.Overlays = [[ "Arrow", { length: 10, width:7, foldback:0.55, location:1 }]];


  jsPlumb.Defaults.EndpointHoverStyle = {fillStyle: pinkish};
  jsPlumb.Defaults.HoverPaintStyle = {lineWidth:2, strokeStyle: pinkish};


  // set keyboard event listeners ...
  $(document).keydown(function(k) {
    // ONLY capture keys if we're in 'visualize code' mode:
    if (appMode == 'visualize' && !keyStuckDown) {
      if (k.keyCode == 37) { // left arrow
        if (curInstr > 0) {
          // if there is a prev breakpoint, then jump to it ...
          if (sortedBreakpointsList.length > 0) {
            var prevBreakpoint = findPrevBreakpoint(curInstr);
            if (prevBreakpoint != -1) {
              curInstr = prevBreakpoint;
            }
            else {
              curInstr -= 1; // prevent keyboard keys from "getting stuck" on a solitary breakpoint
            }
          }
          else {
            curInstr -= 1;
          }
          updateOutput();
        }

        k.preventDefault(); // don't horizontally scroll the display

        keyStuckDown = true;
      }
      else if (k.keyCode == 39) { // right arrow
        if (curInstr < curTrace.length - 1) {
          // if there is a next breakpoint, then jump to it ...
          if (sortedBreakpointsList.length > 0) {
            var nextBreakpoint = findNextBreakpoint(curInstr);
            if (nextBreakpoint != -1) {
              curInstr = nextBreakpoint;
            }
            else {
              curInstr += 1; // prevent keyboard keys from "getting stuck" on a solitary breakpoint
            }
          }
          else {
            curInstr += 1;
          }
          updateOutput();
        }

        k.preventDefault(); // don't horizontally scroll the display

        keyStuckDown = true;
      }
    }
  });

  $(document).keyup(function(k) {
    keyStuckDown = false;
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
    alert("Server error (possibly due to memory/resource overload).");

    $('#executeBtn').html("Visualize execution");
    $('#executeBtn').attr('disabled', false);
  });

}

