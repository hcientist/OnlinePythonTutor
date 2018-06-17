// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

/* TODO:

- substitute in a non-live version of the live editor from opt-live.js
  in addition to the janky current version of the editor

*/


/* pytutor coding gotchas:

- *NEVER* use raw $(__) or d3.select(__) statements to select DOM elements.

  *ALWAYS* use myViz.domRoot or myViz.domRootD3 for jQuery and D3, respectively.

  Otherwise things will break in weird ways when you have more than one
  visualization embedded within a webpage, due to multiple matches in
  the global namespace.

- always use generateID and generateHeapObjID to generate unique CSS
  IDs, or else things will break when multiple ExecutionVisualizer
  instances are on a webpage

*/


require('./lib/d3.v2.min.js');
require('./lib/jquery-3.0.0.min.js');
require('./lib/jquery.jsPlumb-1.3.10-all-min.js'); // DO NOT UPGRADE ABOVE 1.3.10 OR ELSE BREAKAGE WILL OCCUR 
require('./lib/jquery-ui-1.11.4/jquery-ui.js');
require('./lib/jquery-ui-1.11.4/jquery-ui.css');
require('./lib/jquery.ba-bbq.js'); // contains slight pgbovine modifications
require('../css/pytutor');


// for TypeScript
declare var jQuery: JQueryStatic;
declare var jsPlumb: any;


export var SVG_ARROW_POLYGON = '0,3 12,3 12,0 18,5 12,10 12,7 0,7';
var SVG_ARROW_HEIGHT = 10; // must match height of SVG_ARROW_POLYGON

/* colors - see pytutor.css for more colors */
export var brightRed = '#e93f34';
var connectorBaseColor = '#005583';
var connectorHighlightColor = brightRed;
var connectorInactiveColor = '#cccccc';
var errorColor = brightRed;
var breakpointColor = brightRed;

// Unicode arrow types: '\u21d2', '\u21f0', '\u2907'
export var darkArrowColor = brightRed;
export var lightArrowColor = '#c9e6ca';

var heapPtrSrcRE = /__heap_pointer_src_/;
var rightwardNudgeHack = true; // suggested by John DeNero, toggle with global

// returns a list of length a.length * b.length with elements from both
// mixed. the elements of a and b should be primitives, but if the first element
// is a list, it flattens it. e.g.,:
//   multiplyLists([1, 2, 3], [4, 5]) -> [[1,4], [1,5], [2,4], [2,5], [3,4], [3,5]]
function multiplyLists(a, b) {
  var ret = [];
  for (var i = 0; i < a.length; i++) {
    for (var j = 0; j < b.length; j++) {
      var elt = a[i];
      // flatten list
      if ($.isArray(elt)) {
        ret.push(elt.concat(b[j]));
      } else {
        ret.push([elt, b[j]]);
      }
    }
  }
  return ret;
}

var newlineAllRegex = new RegExp('\n', 'g');
var doubleQuoteAllRegex = new RegExp('\"', 'g');
var tabAllRegex = new RegExp("\t", 'g');

// the main event!
export class ExecutionVisualizer {
  static curVisualizerID = 1;

  static DEFAULT_EMBEDDED_CODE_DIV_WIDTH = 350;
  static DEFAULT_EMBEDDED_CODE_DIV_HEIGHT = 400;

  // always nest values of these types within objects to make the
  // visualization look cleaner:
  // - functions should be nested within heap objects since that's a more
  //   intuitive rendering for methods (i.e., functions within objects)
  // - lots of special cases for function/property-like python types that we should inline
  static DEFAULT_ALWAYS_NEST_TYPES = ['FUNCTION', 'JS_FUNCTION',
                                      'property', 'classmethod', 'staticmethod', 'builtin_function_or_method',
                                      'member_descriptor', 'getset_descriptor', 'method_descriptor', 'wrapper_descriptor'];

  objInAlwaysNestTypes(obj) {
    if (!obj) return false;
    assert($.isArray(obj));
    if (this.params.alwaysNestTypes.indexOf(obj[0]) >= 0) {
      // is the type name in alwaysNestTypes?
      return true;
    } else if (obj.length >= 2 &&
               (obj[0] == 'INSTANCE' || obj[0] == 'INSTANCE_PPRINT') &&
               (this.params.alwaysNestTypes.indexOf(obj[1]) >= 0)) {
      // otherwise is this an INSTANCE with the type name (obj[1]) in alwaysNestTypes?
      return true;
    } else {
      return false;
    }
  }

  // should this object be nested within another one?
  shouldNestObject(obj) {
    return (!this.params.disableHeapNesting || this.objInAlwaysNestTypes(obj));
  }

  params: any = {};
  curInputCode: string;
  curTrace: any[];

  // an array of objects with the following fields:
  //   'text' - the text of the line of code
  //   'lineNumber' - one-indexed (always the array index + 1)
  //   'executionPoints' - an ordered array of zero-indexed execution points where this line was executed
  //   'breakpointHere' - has a breakpoint been set here?
  codeOutputLines: {text: string, lineNumber: number, executionPoints: number[], breakpointHere: boolean}[] = [];

  promptForUserInput: boolean;
  userInputPromptStr: string;
  promptForMouseInput: boolean;

  codDisplay: CodeDisplay;
  navControls: NavigationController;
  outputBox: ProgramOutputBox;
  dataViz: DataVisualizer;

  domRoot: any;
  domRootD3: any;

  curInstr: number = 0;

  updateHistory: any[];
  creationTime: number;

  // API for adding a hook, created by David Pritchard
  // keys, hook names; values, list of functions
  pytutor_hooks: {string?: any[]} = {};

  // represent the current state of the visualizer object; i.e., which
  // step is it currently visualizing?
  prevLineIsReturn: boolean;
  curLineIsReturn: boolean;
  prevLineNumber: number;
  curLineNumber: number;
  curLineExceptionMsg: string;

  // true iff trace ended prematurely since maximum instruction limit has
  // been reached
  instrLimitReached: boolean = false;
  instrLimitReachedWarningMsg: string;

  hasRendered: boolean = false;

  visualizerID: number;

  breakpoints: d3.Map<{}> = d3.map(); // set of execution points to set as breakpoints
  sortedBreakpointsList: any[] = [];  // sorted and synced with breakpoints

  // Constructor with an ever-growing feature-crepped list of options :)
  // domRootID is the string ID of the root element where to render this instance
  //
  // dat is data returned by the Python Tutor backend consisting of two fields:
  //   code  - string of executed code
  //   trace - a full execution trace
  //
  // params is an object containing optional parameters, such as:
  //   jumpToEnd - if non-null, jump to the very end of execution if
  //               there's no error, or if there's an error, jump to the
  //               FIRST ENTRY with an error
  //   startingInstruction - the (zero-indexed) execution point to display upon rendering
  //                         if this is set, then it *overrides* jumpToEnd
  //   codeDivHeight - maximum height of #pyCodeOutputDiv (in integer pixels)
  //   codeDivWidth  - maximum width  of #pyCodeOutputDiv (in integer pixels)
  //   editCodeBaseURL - the base URL to visit when the user clicks 'Edit code' (if null, then 'Edit code' link hidden)
  //   embeddedMode         - shortcut for codeDivWidth=DEFAULT_EMBEDDED_CODE_DIV_WIDTH,
  //                                       codeDivHeight=DEFAULT_EMBEDDED_CODE_DIV_HEIGHT
  //                          (and hide a bunch of other stuff & don't activate keyboard shortcuts!)
  //   disableHeapNesting   - if true, then render all heap objects at the top level (i.e., no nested objects)
  //   alwaysNestTypes      - if non-null, a list of type names to ALWAYS nest within heap objects
  //                          (supersedes disableHeapNesting, defaults to DEFAULT_ALWAYS_NEST_TYPES)
  //   drawParentPointers   - if true, then draw environment diagram parent pointers for all frames
  //                          WARNING: there are hard-to-debug MEMORY LEAKS associated with activating this option
  //   textualMemoryLabels  - render references using textual memory labels rather than as jsPlumb arrows.
  //                          this is good for slow browsers or when used with disableHeapNesting
  //                          to prevent "arrow overload"
  //   updateOutputCallback - function to call (with 'this' as parameter)
  //                          whenever this.updateOutput() is called
  //                          (BEFORE rendering the output display)
  //   heightChangeCallback - function to call (with 'this' as parameter)
  //                          whenever the HEIGHT of #dataViz changes
  //   verticalStack - if true, then stack code display ON TOP of visualization
  //                   (else place side-by-side)
  //   visualizerIdOverride - override visualizer ID instead of auto-assigning it
  //                          (BE CAREFUL ABOUT NOT HAVING DUPLICATE IDs ON THE SAME PAGE,
  //                           OR ELSE ARROWS AND OTHER STUFF WILL GO HAYWIRE!)
  //   executeCodeWithRawInputFunc - function to call when you want to re-execute the given program
  //                                 with some new user input (somewhat hacky!)
  //   compactFuncLabels - render functions with a 'func' prefix and no type label
  //   showAllFrameLabels - display frame and parent frame labels for all functions (default: false)
  //   hideCode - hide the code display and show only the data structure viz
  //   lang - to render labels in a style appropriate for other languages,
  //          and to display the proper language in langDisplayDiv:
  //          'py2' for Python 2, 'py3' for Python 3, 'js' for JavaScript, 'java' for Java,
  //          'ts' for TypeScript, 'ruby' for Ruby, 'c' for C, 'cpp' for C++
  //          'py3anaconda' for Python 3 with Anaconda
  //          [default is Python-style labels]
  constructor(domRootID, dat, params) {
    this.curInputCode = dat.code.rtrim(); // kill trailing spaces
    this.params = params;
    this.curTrace = dat.trace;

    // postprocess the trace
    if (this.curTrace.length > 0) {
      var lastEntry = this.curTrace[this.curTrace.length - 1];

      // if the final entry is raw_input or mouse_input, then trim it from the trace and
      // set a flag to prompt for user input when execution advances to the
      // end of the trace
      if (lastEntry.event === 'raw_input') {
        this.promptForUserInput = true;
        this.userInputPromptStr = htmlspecialchars(lastEntry.prompt);
        this.curTrace.pop() // kill last entry so that it doesn't get displayed
      }
      else if (lastEntry.event === 'mouse_input') {
        this.promptForMouseInput = true;
        this.userInputPromptStr = htmlspecialchars(lastEntry.prompt);
        this.curTrace.pop() // kill last entry so that it doesn't get displayed
      }
      else if (lastEntry.event === 'instruction_limit_reached') {
        this.instrLimitReached = true;
        this.instrLimitReachedWarningMsg = lastEntry.exception_msg;
        this.curTrace.pop() // postprocess to kill last entry
      }
    }

    // if you have multiple ExecutionVisualizer on a page, their IDs
    // better be unique or else you'll run into rendering problems
    if (this.params.visualizerIdOverride) {
      this.visualizerID = this.params.visualizerIdOverride;
    } else {
      this.visualizerID = ExecutionVisualizer.curVisualizerID;
      assert(this.visualizerID > 0);
      ExecutionVisualizer.curVisualizerID++;
    }

    // sanitize to avoid nasty 'undefined' states
    this.params.disableHeapNesting = (this.params.disableHeapNesting === true);
    this.params.drawParentPointers = (this.params.drawParentPointers === true);
    this.params.textualMemoryLabels = (this.params.textualMemoryLabels === true);
    this.params.showAllFrameLabels = (this.params.showAllFrameLabels === true);

    if (this.params.alwaysNestTypes === undefined) {
      this.params.alwaysNestTypes = ExecutionVisualizer.DEFAULT_ALWAYS_NEST_TYPES;
    }
    assert($.isArray(this.params.alwaysNestTypes));

    // insert ExecutionVisualizer into domRootID in the DOM
    var tmpRoot = $('#' + domRootID);
    var tmpRootD3 = d3.select('#' + domRootID);
    tmpRoot.html('<div class="ExecutionVisualizer"></div>');

    // the root elements for jQuery and D3 selections, respectively.
    // ALWAYS use these and never use raw $(__) or d3.select(__)
    this.domRoot = tmpRoot.find('div.ExecutionVisualizer');
    this.domRootD3 = tmpRootD3.select('div.ExecutionVisualizer');

    if (this.params.lang === 'java') {
      this.activateJavaFrontend(); // ohhhh yeah! do this before initializing codeOutputLines (ugh order dependency)
    }


    var lines = this.curInputCode.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var cod = lines[i];
      var n: {text: string, lineNumber: number, executionPoints: number[], breakpointHere: boolean} = {
        text: cod,
        lineNumber: i + 1,
        executionPoints: [],
        breakpointHere: false,
      };

      $.each(this.curTrace, function(j, elt) {
        if (elt.line === n.lineNumber) {
          n.executionPoints.push(j);
        }
      });

      // if there is a comment containing 'breakpoint' and this line was actually executed,
      // then set a breakpoint on this line
      var breakpointInComment = false;
      var toks = cod.split('#');
      for (var j = 1 /* start at index 1, not 0 */; j < toks.length; j++) {
        if (toks[j].indexOf('breakpoint') != -1) {
          breakpointInComment = true;
        }
      }

      if (breakpointInComment && n.executionPoints.length > 0) {
        n.breakpointHere = true;
        this.addToBreakpoints(n.executionPoints);
      }

      this.codeOutputLines.push(n);
    }

    this.try_hook("end_constructor", {myViz:this});
    this.render(); // go for it!
  }

  /* API for adding a hook, created by David Pritchard
     https://github.com/daveagp

    [this documentation is a bit deprecated since Philip made try_hook a
     method of ExecutionVisualizer, but the general ideas remain]

   An external user should call
     add_pytutor_hook("hook_name_here", function(args) {...})
   args will be a javascript object with several named properties;
   this is meant to be similar to Python's keyword arguments.

   The hooked function should return an array whose first element is a boolean:
   true if it completely handled the situation (no further hooks
   nor the base function should be called); false otherwise (wasn't handled).
   If the hook semantically represents a function that returns something,
   the second value of the returned array is that semantic return value.

   E.g. for the Java visualizer a simplified version of a hook we use is:

  add_pytutor_hook(
    "isPrimitiveType",
    function(args) {
      var obj = args.obj; // unpack
      if (obj instanceof Array && obj[0] == "CHAR-LITERAL")
        return [true, true]; // yes we handled it, yes it's primitive
      return [false]; // didn't handle it, let someone else
    });

   Hook callbacks can return false or undefined (i.e. no return
   value) in lieu of [false].

   NB: If multiple functions are added to a hook, the oldest goes first. */
  add_pytutor_hook(hook_name, func) {
    if (this.pytutor_hooks[hook_name])
      this.pytutor_hooks[hook_name].push(func);
    else
      this.pytutor_hooks[hook_name] = [func];
  }

  /*  [this documentation is a bit deprecated since Philip made try_hook a
       method of ExecutionVisualizer, but the general ideas remain]

  try_hook(hook_name, args): how the internal codebase invokes a hook.

  args will be a javascript object with several named properties;
  this is meant to be similar to Python's keyword arguments. E.g.,

  function isPrimitiveType(obj) {
    var hook_result = try_hook("isPrimitiveType", {obj:obj});
    if (hook_result[0]) return hook_result[1];
    // go on as normal if the hook didn't handle it

  Although add_pytutor_hook allows the hooked function to
  return false or undefined, try_hook will always return
  something with the strict format [false], [true] or [true, ...]. */
  try_hook(hook_name, args) {
    if (this.pytutor_hooks[hook_name]) {
      for (var i=0; i<this.pytutor_hooks[hook_name].length; i++) {
        // apply w/o "this", and pack sole arg into array as required by apply
        var handled_and_result
          = this.pytutor_hooks[hook_name][i].apply(null, [args]);

        if (handled_and_result && handled_and_result[0])
          return handled_and_result;
      }
    }
    return [false];
  }

  // create a unique ID, which is often necessary so that jsPlumb doesn't get confused
  // due to multiple ExecutionVisualizer instances being displayed simultaneously
  generateID(original_id) {
    // (it's safer to start names with a letter rather than a number)
    return 'v' + this.visualizerID + '__' + original_id;
  }

  render() {
    if (this.hasRendered) {
      alert('ERROR: You should only call render() ONCE on an ExecutionVisualizer object.');
      return;
    }

    var myViz = this; // to prevent confusion of 'this' inside of nested functions

    if (this.params.verticalStack) {
      this.domRoot.html('<table border="0" class="visualizer">\
                           <tr><td class="vizLayoutTd" id="vizLayoutTdFirst""></td></tr>\
                           <tr><td class="vizLayoutTd" id="vizLayoutTdSecond"></td></tr>\
                         </table>');
    }
    else {
      this.domRoot.html('<table border="0" class="visualizer"><tr>\
                           <td class="vizLayoutTd" id="vizLayoutTdFirst"></td>\
                           <td class="vizLayoutTd" id="vizLayoutTdSecond"></td>\
                         </tr></table>');
    }

    // create a container for a resizable slider to encompass
    // both CodeDisplay and NavigationController
    this.domRoot.find('#vizLayoutTdFirst').append('<div id="codAndNav" style="width: 550px;"/>');
    var base = this.domRoot.find('#vizLayoutTdFirst #codAndNav');
    var baseD3 = this.domRootD3.select('#vizLayoutTdFirst #codAndNav');

    this.codDisplay = new CodeDisplay(this, base, baseD3,
                                      this.curInputCode, this.params.lang, this.params.editCodeBaseURL);
    this.navControls = new NavigationController(this, base, baseD3, this.curTrace.length);

    if (this.params.embeddedMode) {
      // don't override if they've already been set!
      if (this.params.codeDivWidth === undefined) {
        this.params.codeDivWidth = ExecutionVisualizer.DEFAULT_EMBEDDED_CODE_DIV_WIDTH;
      }

      if (this.params.codeDivHeight === undefined) {
        this.params.codeDivHeight = ExecutionVisualizer.DEFAULT_EMBEDDED_CODE_DIV_HEIGHT;
      }

      // add an extra label to link back to the main site, so that viewers
      // on the embedded page know that they're seeing an OPT visualization
      base.append('<div style="font-size: 8pt; margin-bottom: 10px;"><a href="http://pythontutor.com" target="_blank" style="color: #3D58A2;">Python Tutor</a> by <a href="https://twitter.com/pgbovine" target="_blank" style="color: #3D58A2;">Philip Guo</a>. Support with a <a href="http://pgbovine.net/support.htm" target="_blank">small donation</a>.</div>');
      base.find('#codeFooterDocs').hide(); // cut out extraneous docs
    } else {
      // also display credits:
      base.append('<div style="font-size: 9pt; margin-top: 5px; margin-bottom: 10px;">Created by <a href="https://twitter.com/pgbovine" target="_blank">@pgbovine</a>. Support with a <a href="http://pgbovine.net/support.htm" target="_blank">small donation</a>.</div>');
    }

    // not enough room for these extra buttons ...
    if (this.params.codeDivWidth &&
        this.params.codeDivWidth < 470) {
      this.domRoot.find('#jmpFirstInstr').hide();
      this.domRoot.find('#jmpLastInstr').hide();
    }

    if (this.params.codeDivWidth) {
      this.domRoot.find('#codAndNav').width(this.params.codeDivWidth);
    }

    if (this.params.codeDivHeight) {
      this.domRoot.find('#pyCodeOutputDiv')
        .css('max-height', this.params.codeDivHeight + 'px');
    }

    // enable left-right draggable pane resizer (originally from David Pritchard)
    base.resizable({
      handles: "e", // "east" (i.e., right)
      minWidth: 100, //otherwise looks really goofy
      resize: (event, ui) => {
        this.domRoot.find("#codeDisplayDiv").css("height", "auto"); // redetermine height if necessary
        this.navControls.renderSliderBreakpoints(this.sortedBreakpointsList); // update breakpoint display accordingly on resize
        if (this.params.updateOutputCallback) // report size change
          this.params.updateOutputCallback(this);
      }});

    this.outputBox = new ProgramOutputBox(this, this.domRoot.find('#vizLayoutTdSecond'),
                                          this.params.embeddedMode ? '45px' : null);
    this.dataViz = new DataVisualizer(this,
                                      this.domRoot.find('#vizLayoutTdSecond'),
                                      this.domRootD3.select('#vizLayoutTdSecond'));

    myViz.navControls.showError(this.instrLimitReachedWarningMsg);
    myViz.navControls.setupSlider(this.curTrace.length - 1);

    if (this.params.startingInstruction) {
      this.params.jumpToEnd = false; // override! make sure to handle FIRST

      // weird special case for something like:
      // e=raw_input(raw_input("Enter something:"))
      if (this.params.startingInstruction == this.curTrace.length) {
        this.params.startingInstruction--;
      }

      // fail-soft with out-of-bounds startingInstruction values:
      if (this.params.startingInstruction < 0) {
        this.params.startingInstruction = 0;
      }
      if (this.params.startingInstruction >= this.curTrace.length) {
        this.params.startingInstruction = this.curTrace.length - 1;
      }

      assert(0 <= this.params.startingInstruction &&
             this.params.startingInstruction < this.curTrace.length);
      this.curInstr = this.params.startingInstruction;
    }

    if (this.params.jumpToEnd) {
      var firstErrorStep = -1;
      for (var i = 0; i < this.curTrace.length; i++) {
        var e = this.curTrace[i];
        if (e.event == 'exception' || e.event == 'uncaught_exception') {
          firstErrorStep = i;
          break;
        }
      }

      // set to first error step if relevant since that's more informative
      // than simply jumping to the very end
      if (firstErrorStep >= 0) {
        this.curInstr = firstErrorStep;
      } else {
        this.curInstr = this.curTrace.length - 1;
      }
    }

    if (this.params.hideCode) {
      this.domRoot.find('#vizLayoutTdFirst').hide(); // gigantic hack!
    }

    this.dataViz.precomputeCurTraceLayouts();

    if (!this.params.hideCode) {
      this.codDisplay.renderPyCodeOutput();
    }

    this.updateOutput();
    this.redrawConnectors(); // do this at the end
    this.hasRendered = true;
    this.try_hook("end_render", {myViz:this});
  }

  _getSortedBreakpointsList() {
    var ret = [];
    this.breakpoints.forEach(function(k, v) {
      ret.push(Number(k)); // these should be NUMBERS, not strings
    });
    ret.sort(function(x,y){return x-y}); // WTF, javascript sort is lexicographic by default!
    return ret;
  }

  addToBreakpoints(executionPoints) {
    $.each(executionPoints, (i, ep) => {
      this.breakpoints.set(ep, 1);
    });
    this.sortedBreakpointsList = this._getSortedBreakpointsList(); // keep synced!
  }

  removeFromBreakpoints(executionPoints) {
    $.each(executionPoints, (i, ep) => {
      this.breakpoints.remove(ep);
    });
    this.sortedBreakpointsList = this._getSortedBreakpointsList(); // keep synced!
  }

  setBreakpoint(d) {
    this.addToBreakpoints(d.executionPoints);
    this.navControls.renderSliderBreakpoints(this.sortedBreakpointsList);
  }

  unsetBreakpoint(d) {
    this.removeFromBreakpoints(d.executionPoints);
    this.navControls.renderSliderBreakpoints(this.sortedBreakpointsList);
  }

  // find the previous/next breakpoint to c or return -1 if it doesn't exist
  findPrevBreakpoint() {
    var c = this.curInstr;

    if (this.sortedBreakpointsList.length == 0) {
      return -1;
    }
    else {
      for (var i = 1; i < this.sortedBreakpointsList.length; i++) {
        var prev = this.sortedBreakpointsList[i-1];
        var cur = this.sortedBreakpointsList[i];
        if (c <= prev)
          return -1;
        if (cur >= c)
          return prev;
      }

      // final edge case:
      var lastElt = this.sortedBreakpointsList[this.sortedBreakpointsList.length - 1];
      return (lastElt < c) ? lastElt : -1;
    }
  }

  findNextBreakpoint() {
    var c = this.curInstr;

    if (this.sortedBreakpointsList.length == 0) {
      return -1;
    }
    // usability hack: if you're currently on a breakpoint, then
    // single-step forward to the next execution point, NOT the next
    // breakpoint. it's often useful to see what happens when the line
    // at a breakpoint executes.
    else if ($.inArray(c, this.sortedBreakpointsList) >= 0) {
      return c + 1;
    }
    else {
      for (var i = 0; i < this.sortedBreakpointsList.length - 1; i++) {
        var cur = this.sortedBreakpointsList[i];
        var next = this.sortedBreakpointsList[i+1];
        if (c < cur)
          return cur;
        if (cur <= c && c < next) // subtle
          return next;
      }

      // final edge case:
      var lastElt = this.sortedBreakpointsList[this.sortedBreakpointsList.length - 1];
      return (lastElt > c) ? lastElt : -1;
    }
  }

  // returns true if action successfully taken
  stepForward() {
    var myViz = this;

    if (myViz.curInstr < myViz.curTrace.length - 1) {
      // if there is a next breakpoint, then jump to it ...
      if (myViz.sortedBreakpointsList.length > 0) {
        var nextBreakpoint = myViz.findNextBreakpoint();
        if (nextBreakpoint != -1)
          myViz.curInstr = nextBreakpoint;
        else
          myViz.curInstr += 1; // prevent "getting stuck" on a solitary breakpoint
      }
      else {
        myViz.curInstr += 1;
      }
      myViz.updateOutput(true);
      return true;
    }

    return false;
  }

  // returns true if action successfully taken
  stepBack() {
    var myViz = this;

    if (myViz.curInstr > 0) {
      // if there is a prev breakpoint, then jump to it ...
      if (myViz.sortedBreakpointsList.length > 0) {
        var prevBreakpoint = myViz.findPrevBreakpoint();
        if (prevBreakpoint != -1)
          myViz.curInstr = prevBreakpoint;
        else
          myViz.curInstr -= 1; // prevent "getting stuck" on a solitary breakpoint
      }
      else {
        myViz.curInstr -= 1;
      }
      myViz.updateOutput();
      return true;
    }

    return false;
  }

  // This function is called every time the display needs to be updated
  updateOutput(smoothTransition=false) {
    if (this.params.hideCode) {
      this.updateOutputMini();
    }
    else {
      this.updateOutputFull(smoothTransition);
    }
    this.outputBox.renderOutput(this.curTrace[this.curInstr].stdout);
    this.try_hook("end_updateOutput", {myViz:this});
  }

  // does a LOT of stuff, called by updateOutput
  updateOutputFull(smoothTransition) {
    assert(this.curTrace);
    assert(!this.params.hideCode);

    var myViz = this; // to prevent confusion of 'this' inside of nested functions

    // there's no point in re-rendering if this pane isn't even visible in the first place!
    if (!myViz.domRoot.is(':visible')) {
      return;
    }

    myViz.updateLineAndExceptionInfo(); // very important to call this before rendering code (argh order dependency)

    var prevDataVizHeight = myViz.dataViz.height();

    this.codDisplay.updateCodOutput(smoothTransition);

    // call the callback if necessary (BEFORE rendering)
    if (this.params.updateOutputCallback) {
      this.params.updateOutputCallback(this);
    }

    var totalInstrs = this.curTrace.length;
    var isFirstInstr = (this.curInstr == 0);
    var isLastInstr = (this.curInstr == (totalInstrs-1));
    var msg = "Step " + String(this.curInstr + 1) + " of " + String(totalInstrs-1);
    if (isLastInstr) {
      if (this.promptForUserInput || this.promptForMouseInput) {
        msg = '<b><font color="' + brightRed + '">Enter user input below:</font></b>';
      } else if (this.instrLimitReached) {
        msg = "Instruction limit reached";
      } else {
        msg = "Program terminated";
      }
    }

    this.navControls.setVcrControls(msg, isFirstInstr, isLastInstr);
    this.navControls.setSliderVal(this.curInstr);

    // render error (if applicable):
    if (myViz.curLineExceptionMsg) {
      if (myViz.curLineExceptionMsg === "Unknown error") {
        myViz.navControls.showError('Unknown error: Please email a bug report to philip@pgbovine.net');
      } else {
        myViz.navControls.showError(myViz.curLineExceptionMsg);
      }
    } else if (!this.instrLimitReached) { // ugly, I know :/
      myViz.navControls.showError(null);
    }

    // finally, render all of the data structures
    this.dataViz.renderDataStructures(this.curInstr);

    // call the callback if necessary (AFTER rendering)
    if (myViz.dataViz.height() != prevDataVizHeight) {
      if (this.params.heightChangeCallback) {
        this.params.heightChangeCallback(this);
      }
    }

    if (isLastInstr &&
        myViz.params.executeCodeWithRawInputFunc &&
        myViz.promptForUserInput) {
      this.navControls.showUserInputDiv();
    } else {
      this.navControls.hideUserInputDiv();
    }
  } // end of updateOutputFull

  updateOutputMini() {
    assert(this.params.hideCode);
    this.dataViz.renderDataStructures(this.curInstr);
  }

  renderStep(step) {
    assert(0 <= step);
    assert(step < this.curTrace.length);

    // ignore redundant calls
    if (this.curInstr == step) {
      return;
    }

    this.curInstr = step;
    this.updateOutput();
  }

  redrawConnectors() {
    this.dataViz.redrawConnectors();
  }

  // All of the Java frontend code in this function was written by David
  // Pritchard and Will Gwozdz, and integrated into pytutor.js by Philip Guo
  activateJavaFrontend() {
    var prevLine = null;
    this.curTrace.forEach((e, i) => {
      // ugh the Java backend doesn't attach line numbers to exception
      // events, so just take the previous line number as our best guess
      if (e.event === 'exception' && !e.line) {
        e.line = prevLine;
      }

      // super hack by Philip that reverses the direction of the stack so
      // that it grows DOWN and renders the same way as the Python and JS
      // visualizer stacks
      if (e.stack_to_render !== undefined) {
        e.stack_to_render.reverse();
      }

      prevLine = e.line;
    });

    this.add_pytutor_hook(
      "renderPrimitiveObject",
      function(args) {
        var obj = args.obj, d3DomElement = args.d3DomElement;
        var typ = typeof obj;
        if (obj instanceof Array && obj[0] == "VOID") {
          d3DomElement.append('<span class="voidObj">void</span>');
        }
        else if (obj instanceof Array && obj[0] == "NUMBER-LITERAL") {
          // actually transmitted as a string
          d3DomElement.append('<span class="numberObj">' + obj[1] + '</span>');
        }
        else if (obj instanceof Array && obj[0] == "CHAR-LITERAL") {
          var asc = obj[1].charCodeAt(0);
          var ch = obj[1];
          
          // default
          var show = asc.toString(16);
          while (show.length < 4) show = "0" + show;
          show = "\\u" + show;
          
          if (ch == "\n") show = "\\n";
          else if (ch == "\r") show = "\\r";
          else if (ch == "\t") show = "\\t";
          else if (ch == "\b") show = "\\b";
          else if (ch == "\f") show = "\\f";
          else if (ch == "\'") show = "\\\'";
          else if (ch == "\"") show = "\\\"";
          else if (ch == "\\") show = "\\\\";
          else if (asc >= 32) show = ch;
          
          // stringObj to make monospace
          d3DomElement.append('<span class="stringObj">\'' + show + '\'</span>');
        }
        else
          return [false]; // we didn't handle it
        return [true]; // we handled it
      });

    this.add_pytutor_hook(
      "isPrimitiveType", 
      function(args) {
        var obj = args.obj;
        if ((obj instanceof Array && obj[0] == "VOID")
            || (obj instanceof Array && obj[0] == "NUMBER-LITERAL")
            || (obj instanceof Array && obj[0] == "CHAR-LITERAL")
            || (obj instanceof Array && obj[0] == "ELIDE"))
          return [true, true]; // we handled it, it's primitive
        return [false]; // didn't handle it
      });

    this.add_pytutor_hook(
      "end_updateOutput",
      function(args) {
        var myViz = args.myViz;
        var curEntry = myViz.curTrace[myViz.curInstr];
        if (myViz.params.stdin && myViz.params.stdin != "") {
          var stdinPosition = curEntry.stdinPosition || 0;
          var stdinContent =
            '<span style="color:lightgray;text-decoration: line-through">'+
            escapeHtml(myViz.params.stdin.substr(0, stdinPosition))+
            '</span>'+
            escapeHtml(myViz.params.stdin.substr(stdinPosition));
          myViz.domRoot.find('#stdinShow').html(stdinContent);
        }
        return [false]; 
      });

    this.add_pytutor_hook(
      "end_render",
      function(args) {
        var myViz = args.myViz;
        
        if (myViz.params.stdin && myViz.params.stdin != "") {
          var stdinHTML = '<div id="stdinWrap">stdin:<pre id="stdinShow" style="border:1px solid gray"></pre></div>';
          myViz.domRoot.find('#dataViz').append(stdinHTML); // TODO: leaky abstraction with #dataViz
        }

        myViz.domRoot.find('#'+myViz.generateID('globals_header')).html("Static fields");
      });

    this.add_pytutor_hook(
      "isLinearObject",
      function(args) {
        var heapObj = args.heapObj;
        if (heapObj[0]=='STACK' || heapObj[0]=='QUEUE')
          return ['true', 'true'];
        return ['false'];
      });

    this.add_pytutor_hook(
      "renderCompoundObject",
      function(args) {
        var objID = args.objID;
        var d3DomElement = args.d3DomElement;
        var obj = args.obj;
        var typeLabelPrefix = args.typeLabelPrefix;
        var myViz = args.myViz;
        var stepNum = args.stepNum;

        if (!(obj[0] == 'LIST' || obj[0] == 'QUEUE' || obj[0] == 'STACK')) 
          return [false]; // didn't handle

        var label = obj[0].toLowerCase();
        var visibleLabel = {list:'array', queue:'queue', stack:'stack'}[label];
        
        if (obj.length == 1) {
          d3DomElement.append('<div class="typeLabel">' + typeLabelPrefix + 'empty ' + visibleLabel + '</div>');
          return [true]; //handled
        }

        d3DomElement.append('<div class="typeLabel">' + typeLabelPrefix + visibleLabel + '</div>');
        d3DomElement.append('<table class="' + label + 'Tbl"></table>');
        var tbl = d3DomElement.children('table');
        
        if (obj[0] == 'LIST') {
          tbl.append('<tr></tr><tr></tr>');
          var headerTr = tbl.find('tr:first');
          var contentTr = tbl.find('tr:last');
          
          // i: actual index in json object; ind: apparent index
          for (var i=1, ind=0; i<obj.length; i++) {
            var val = obj[i];
            var elide = val instanceof Array && val[0] == 'ELIDE';
            
            // add a new column and then pass in that newly-added column
            // as d3DomElement to the recursive call to child:
            headerTr.append('<td class="' + label + 'Header"></td>');
            headerTr.find('td:last').append(elide ? "&hellip;" : ind);
            
            contentTr.append('<td class="'+ label + 'Elt"></td>');
            if (!elide) {
              myViz.renderNestedObject(val, stepNum, contentTr.find('td:last'));
              ind++;
            }
            else {
              contentTr.find('td:last').append("&hellip;");
              ind += val[1]; // val[1] is the number of cells to skip
            }
          }
        } // end of LIST handling

       // Stack and Queue handling code by Will Gwozdz
        /* The table produced for stacks and queues is formed slightly differently than the others,
       missing the header row. Two rows made the dashed border not line up properly */
        if (obj[0] == 'STACK') { 
          tbl.append('<tr></tr><tr></tr>');
          var contentTr = tbl.find('tr:last');
          contentTr.append('<td class="'+ label + 'FElt">'+'<span class="stringObj symbolic">&#8596;</span>'+'</td>');
          $.each(obj, function(ind, val) {
            if (ind < 1) return; // skip type tag and ID entry
            contentTr.append('<td class="'+ label + 'Elt"></td>');
            myViz.renderNestedObject(val, stepNum, contentTr.find('td:last'));
          });
          contentTr.append('<td class="'+ label + 'LElt">'+'</td>');
        }
        
        if (obj[0] == 'QUEUE') { 
          tbl.append('<tr></tr><tr></tr>');
          var contentTr = tbl.find('tr:last');    
          // Add arrows showing in/out direction
          contentTr.append('<td class="'+ label + 'FElt">'+'<span class="stringObj symbolic">&#8592;</span></td>');    
          $.each(obj, function(ind, val) {
            if (ind < 1) return; // skip type tag and ID entry
            contentTr.append('<td class="'+ label + 'Elt"></td>');
            myViz.renderNestedObject(val, stepNum, contentTr.find('td:last'));
          });
          contentTr.append('<td class="'+ label + 'LElt">'+'<span class="stringObj symbolic">&#8592;</span></td>');    
        }

        return [true]; // did handle
      });

    this.add_pytutor_hook(
      "end_renderDataStructures",
      function(args) {
        var myViz = args.myViz;
        myViz.domRoot.find("td.instKey:contains('___NO_LABEL!___')").hide();
        myViz.domRoot.find(".typeLabel:contains('dict')").each(
          function(i) {
            if ($(this).html()=='dict')
              $(this).html('symbol table');
            if ($(this).html()=='empty dict')
              $(this).html('empty symbol table');
          });
      });

    // java synthetics cause things which javascript doesn't like in an id

    // VERY important to bind(this) so that when it's called, 'this' is this current object
    var old_generateID = ExecutionVisualizer.prototype.generateID.bind(this);
    this.generateID = function(original_id) {
      var sanitized = original_id.replace(
          /[^0-9a-zA-Z_]/g,
        function(match) {return '-'+match.charCodeAt(0)+'-';}
      );
      return old_generateID(sanitized);
    }

    // utility functions
    var entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': '&quot;',
      "'": '&#39;',
      "/": '&#x2F;'
    };

    var escapeHtml = function(string) {
      return String(string).replace(/[&<>"'\/]/g, function (s) {
          return entityMap[s];
        });
    };
  }

  // update fields corresponding to the current and previously executed lines
  // in the trace so that they can be properly highlighted; must call before
  // rendering code output (NB: argh pesky ordering dependency)
  updateLineAndExceptionInfo() {
    var myViz = this;
    var totalInstrs = myViz.curTrace.length;
    var isLastInstr = myViz.curInstr === (totalInstrs-1);

    myViz.curLineNumber = undefined;
    myViz.prevLineNumber = undefined;
    myViz.curLineIsReturn = undefined;
    myViz.prevLineIsReturn = undefined;
    myViz.curLineExceptionMsg = undefined;

    /* if instrLimitReached, then treat like a normal non-terminating line */
    var isTerminated = (!myViz.instrLimitReached && isLastInstr);

    var curLineNumber = null;
    var prevLineNumber = null;

    var curEntry = myViz.curTrace[myViz.curInstr];

    var curIsReturn = (curEntry.event == 'return');
    var prevIsReturn = false;

    if (myViz.curInstr > 0) {
      prevLineNumber = myViz.curTrace[myViz.curInstr - 1].line;
      prevIsReturn = (myViz.curTrace[myViz.curInstr - 1].event == 'return');

      /* kinda nutsy hack: if the previous line is a return line, don't
         highlight it. instead, highlight the line in the enclosing
         function that called this one (i.e., the call site). e.g.,:

         1. def foo(lst):
         2.   return len(lst)
         3.
         4. y = foo([1,2,3])
         5. print y

         If prevLineNumber is 2 and prevIsReturn, then curLineNumber is
         5, since that's the line that executes right after line 2
         finishes. However, this looks confusing to the user since what
         actually happened here was that the return value of foo was
         assigned to y on line 4. I want to have prevLineNumber be line
         4 so that it gets highlighted. There's no ideal solution, but I
         think that looks more sensible, since line 4 was the previous
         line that executed *in this function's frame*.
      */
      if (prevIsReturn) {
        var idx = myViz.curInstr - 1;
        var retStack = myViz.curTrace[idx].stack_to_render;
        // retStack.length == 0 in rare cases such as inside of an
        // exec() statement. #weird
        if (retStack.length > 0) {
          var retFrameId = retStack[retStack.length - 1].frame_id;

          // now go backwards until we find a 'call' to this frame
          while (idx >= 0) {
            var entry = myViz.curTrace[idx];
            if (entry.event == 'call' && entry.stack_to_render) {
              var topFrame = entry.stack_to_render[entry.stack_to_render.length - 1];
              if (topFrame.frame_id == retFrameId) {
                break; // DONE, we found the call that corresponds to this return
              }
            }
            idx--;
          }

          // now idx is the index of the 'call' entry. we need to find the
          // entry before that, which is the instruction before the call.
          // THAT's the line of the call site.
          if (idx > 0) {
            var callingEntry = myViz.curTrace[idx - 1];
            prevLineNumber = callingEntry.line; // WOOHOO!!!
            prevIsReturn = false; // this is now a call site, not a return
          }
        }
      }
    }

    var hasError = false;
    if (curEntry.event === 'exception' || curEntry.event === 'uncaught_exception') {
      assert(curEntry.exception_msg);
      hasError = true;
      myViz.curLineExceptionMsg = curEntry.exception_msg;
    }

    curLineNumber = curEntry.line;

    // edge case for the final instruction :0
    if (isTerminated && !hasError) {
      // don't show redundant arrows on the same line when terminated ...
      if (prevLineNumber == curLineNumber) {
        curLineNumber = null;
      }
    }

    // add these fields to myViz, which is the point of this function!
    myViz.curLineNumber = curLineNumber;
    myViz.prevLineNumber = prevLineNumber;
    myViz.curLineIsReturn = curIsReturn;
    myViz.prevLineIsReturn = prevIsReturn;
  }

  isOutputLineVisibleForBubbles(lineDivID) {
    var pcod = this.domRoot.find('#pyCodeOutputDiv');

    var lineNoTd = $('#' + lineDivID);
    var LO = lineNoTd.offset().top;

    var PO = pcod.offset().top;
    var ST = pcod.scrollTop();
    var H = pcod.height();

    // add a few pixels of fudge factor on the bottom end due to bottom scrollbar
    return (PO <= LO) && (LO < (PO + H - 25));
  }

} // END class ExecutionVisualizer


// implements the data structure visualization for an entire trace
class DataVisualizer {
  owner: ExecutionVisualizer;
  params: any; // aliases owner.params for convenience
  curTrace: any[]; // aliases owner.curTrace

  domRoot: any;
  domRootD3: any;

  curTraceLayouts: any[];

  jsPlumbInstance: any;
  jsPlumbManager: any;

  classAttrsHidden: any = {}; // kludgy hack for 'show/hide attributes' for class objects

  constructor(owner, domRoot, domRootD3) {
    this.owner = owner;
    this.params = this.owner.params;
    this.curTrace = this.owner.curTrace;

    this.domRoot = domRoot;
    this.domRootD3 = domRootD3;

    var codeVizHTML = `
      <div id="dataViz">
         <table id="stackHeapTable">
           <tr>
             <td id="stack_td">
               <div id="globals_area">
                 <div id="stackHeader">${this.getRealLabel("Frames")}</div>
               </div>
               <div id="stack"></div>
             </td>
             <td id="heap_td">
               <div id="heap">
                 <div id="heapHeader">${this.getRealLabel("Objects")}</div>
               </div>
             </td>
           </tr>
         </table>
       </div>`;

    this.domRoot.append(codeVizHTML);

    // create a persistent globals frame
    // (note that we need to keep #globals_area separate from #stack for d3 to work its magic)
    this.domRoot.find("#globals_area").append('<div class="stackFrame" id="'
      + this.owner.generateID('globals') + '"><div id="' + this.owner.generateID('globals_header')
      + '" class="stackFrameHeader">' + this.getRealLabel('Global frame') + '</div><table class="stackFrameVarTable" id="'
      + this.owner.generateID('global_table') + '"></table></div>');


    this.jsPlumbInstance = jsPlumb.getInstance({
      Endpoint: ["Dot", {radius:3}],
      EndpointStyles: [{fillStyle: connectorBaseColor}, {fillstyle: null} /* make right endpoint invisible */],
      Anchors: ["RightMiddle", "LeftMiddle"],
      PaintStyle: {lineWidth:1, strokeStyle: connectorBaseColor},

      // bezier curve style:
      //Connector: [ "Bezier", { curviness:15 }], /* too much 'curviness' causes lines to run together */
      //Overlays: [[ "Arrow", { length: 14, width:10, foldback:0.55, location:0.35 }]],

      // state machine curve style:
      Connector: [ "StateMachine" ],
      Overlays: [[ "Arrow", { length: 10, width:7, foldback:0.55, location:1 }]],
      EndpointHoverStyles: [{fillStyle: connectorHighlightColor}, {fillstyle: null} /* make right endpoint invisible */],
      HoverPaintStyle: {lineWidth: 1, strokeStyle: connectorHighlightColor},
    });
  }

  height() {
    return this.domRoot.find('#dataViz').height();
  }

  // create a unique CSS ID for a heap object, which should include both
  // its ID and the current step number. this is necessary if we want to
  // display the same heap object at multiple execution steps.
  generateHeapObjID(objID, stepNum) {
    return this.owner.generateID('heap_object_' + objID + '_s' + stepNum);
  }

  // customize labels for each language's preferred vocabulary
  getRealLabel(label) {
    if (this.params.lang === 'js' || this.params.lang === 'ts' || this.params.lang === 'ruby') {
      if (label === 'list') {
        return 'array';
      } else if (label === 'instance') {
        return 'object';
      } else if (label === 'True') {
        return 'true';
      } else if (label === 'False') {
        return 'false';
      }
    }

    if (this.params.lang === 'js') {
      if (label === 'dict') {
        return 'Map';
      } else if (label === 'set') {
        return 'Set';
      }
    } else if (this.params.lang === 'ruby') {
      if (label === 'dict') {
        return 'hash';
      } else if (label === 'set') {
        return 'Set'; // the Ruby Set class is capitalized
      } else if (label === 'function') {
        return 'method';
      } else if (label === 'None') {
        return 'nil';
      } else if (label === 'Global frame') {
        return 'Global Object';
      }
    } else if (this.params.lang === 'java') {
      if (label === 'None') {
        return 'null';
      } else if (label === 'True') {
        return 'true';
      } else if (label === 'False') {
        return 'false';
      }
    } else if (this.params.lang === 'c' || this.params.lang === 'cpp') {
      if (label === 'Global frame') {
        return 'Global variables';
      } else if (label === 'Frames') {
        return 'Stack';
      } else if (label === 'Objects') {
        return 'Heap';
      }
    }

    // default fallthrough case if no matches above
    return label;
  }

  // for managing state related to pesky jsPlumb connectors, need to reset
  // before every call to renderDataStructures, or else all hell breaks
  // loose. yeah, this is kludgy and stateful, but at least all of the
  // relevant state gets shoved into one unified place
  resetJsPlumbManager() {
    this.jsPlumbManager = {
      heap_pointer_src_id: 1, // increment this to be unique for each heap_pointer_src_*

      // Key:   CSS ID of the div element representing the stack frame variable
      //        (for stack->heap connections) or heap object (for heap->heap connections)
      //        the format is: '<this.visualizerID>__heap_pointer_src_<src id>'
      // Value: CSS ID of the div element representing the value rendered in the heap
      //        (the format is given by generateHeapObjID())
      //
      // The reason we need to prepend this.visualizerID is because jsPlumb needs
      // GLOBALLY UNIQUE IDs for use as connector endpoints.
      //
      // TODO: jsPlumb might be able to directly take DOM elements rather
      // than IDs, which makes the above point moot. But let's just stick
      // with this for now until I want to majorly refactor :)

      // the only elements in these sets are NEW elements to be rendered in this
      // particular call to renderDataStructures.
      connectionEndpointIDs: d3.map(),
      heapConnectionEndpointIDs: d3.map(), // subset of connectionEndpointIDs for heap->heap connections
      // analogous to connectionEndpointIDs, except for environment parent pointers
      parentPointerConnectionEndpointIDs: d3.map(),

      renderedHeapObjectIDs: d3.map(), // format given by generateHeapObjID()
    };
  }

  // this method initializes curTraceLayouts
  //
  // Pre-compute the layout of top-level heap objects for ALL execution
  // points as soon as a trace is first loaded. The reason why we want to
  // do this is so that when the user steps through execution points, the
  // heap objects don't "jiggle around" (i.e., preserving positional
  // invariance). Also, if we set up the layout objects properly, then we
  // can take full advantage of d3 to perform rendering and transitions.
  precomputeCurTraceLayouts() {
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

    /* This is a good, simple example to test whether objects "jiggle"

    x = [1, [2, [3, None]]]
    y = [4, [5, [6, None]]]

    x[1][1] = y[1]

    */
    this.curTraceLayouts = [];
    this.curTraceLayouts.push([]); // pre-seed with an empty sentinel to simplify the code

    var myViz = this; // to prevent confusion of 'this' inside of nested functions

    assert(this.curTrace && this.curTrace.length > 0);
    $.each(this.curTrace, function(i, curEntry) {
      var prevLayout = myViz.curTraceLayouts[myViz.curTraceLayouts.length - 1];

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

      function isLinearObj(heapObj) {
        var hook_result = myViz.owner.try_hook("isLinearObj", {heapObj:heapObj});
        if (hook_result[0]) return hook_result[1];

        return heapObj[0] == 'LIST' || heapObj[0] == 'TUPLE' || heapObj[0] == 'SET';
      }

      function recurseIntoObject(id, curRow, newRow) {
        // heuristic for laying out 1-D linked data structures: check for enclosing elements
        // that are structurallyEquivalent() and then lay them out as siblings in the same "row"
        var heapObj = curEntry.heap[id];

        if (myViz.isCppMode()) {
          // soften this assumption since C-style pointers might not point
          // to the heap; they can point to any piece of data!
          if (!heapObj) {
            return;
          }
        } else {
          assert(heapObj);
        }

        if (isLinearObj(heapObj)) {
          $.each(heapObj, function(ind, child) {
            if (ind < 1) return; // skip type tag

            if (!myViz.isPrimitiveType(child)) {
              var childID = getRefID(child);
              if (myViz.structurallyEquivalent(heapObj, curEntry.heap[childID])) {
                updateCurLayout(childID, curRow, newRow);
              }
              else if (!myViz.owner.shouldNestObject(curEntry.heap[childID])) {
                updateCurLayout(childID, [], []);
              }
            }
          });
        }
        else if (heapObj[0] == 'DICT') {
          $.each(heapObj, function(ind, child) {
            if (ind < 1) return; // skip type tag

            var dictKey = child[0];
            if (!myViz.isPrimitiveType(dictKey)) {
              var keyChildID = getRefID(dictKey);
              if (!myViz.owner.shouldNestObject(curEntry.heap[keyChildID])) {
                updateCurLayout(keyChildID, [], []);
              }
            }

            var dictVal = child[1];
            if (!myViz.isPrimitiveType(dictVal)) {
              var childID = getRefID(dictVal);
              if (myViz.structurallyEquivalent(heapObj, curEntry.heap[childID])) {
                updateCurLayout(childID, curRow, newRow);
              }
              else if (!myViz.owner.shouldNestObject(curEntry.heap[childID])) {
                updateCurLayout(childID, [], []);
              }
            }
          });
        }
        else if (heapObj[0] == 'INSTANCE' || heapObj[0] == 'INSTANCE_PPRINT' || heapObj[0] == 'CLASS') {
          jQuery.each(heapObj, function(ind, child) {
            var headerLength = (heapObj[0] == 'INSTANCE') ? 2 : 3;
            if (ind < headerLength) return;

            var instKey = child[0];
            if (!myViz.isPrimitiveType(instKey)) {
              var keyChildID = getRefID(instKey);
              if (!myViz.owner.shouldNestObject(curEntry.heap[keyChildID])) {
                updateCurLayout(keyChildID, [], []);
              }
            }

            var instVal = child[1];
            if (!myViz.isPrimitiveType(instVal)) {
              var childID = getRefID(instVal);
              if (myViz.structurallyEquivalent(heapObj, curEntry.heap[childID])) {
                updateCurLayout(childID, curRow, newRow);
              }
              else if (!myViz.owner.shouldNestObject(curEntry.heap[childID])) {
                updateCurLayout(childID, [], []);
              }
            }
          });
        }
        else if (heapObj[0] == 'FUNCTION' || heapObj[0] == 'JS_FUNCTION') {
          // a Python function object has an optional element at index=3
          // (zero-indexed) that represents default arg names/values
          //
          // a JavaScript function object has funcProperties that we should
          // recurse into in order to precompute their layouts
          var funcProperties = null;
          // traverse into default argument values to precompute their
          // layouts, if applicable
          if (heapObj[0] == 'FUNCTION' && heapObj.length > 3) {
            funcProperties = heapObj[3];
          }
          if (heapObj[0] == 'JS_FUNCTION') {
            assert(heapObj.length == 5);
            funcProperties = heapObj[3];
          }

          if (funcProperties) {
            assert(funcProperties.length > 0);
            $.each(funcProperties, function(ind, kvPair) {
              // copy/paste from INSTANCE/CLASS code above
              var instVal = kvPair[1];
              if (!myViz.isPrimitiveType(instVal)) {
                var childID = getRefID(instVal);
                if (!myViz.owner.shouldNestObject(curEntry.heap[childID])) {
                  updateCurLayout(childID, [], []);
                }
              }
            });
          }
        }
        else if ((heapObj[0] == 'C_ARRAY') || (heapObj[0] == 'C_MULTIDIMENSIONAL_ARRAY') || (heapObj[0] == 'C_STRUCT')) {
          updateCurLayoutAndRecurse(heapObj);
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
        if (idsAlreadyLaidOut.has(id)) {
          return; // PUNT!
        }

        var curLayoutLoc = curLayoutIndexOf(id);

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


      function updateCurLayoutAndRecurse(elt) {
        if (!elt) return; // early bail out

        if (isHeapRef(elt, curEntry.heap)) {
          var id = getRefID(elt);
          updateCurLayout(id, null, []);
        }
        recurseIntoCStructArray(elt);
      }

      // traverse inside of C structs and arrays to find whether they
      // (recursively) contain any references to heap objects within
      // themselves. be able to handle arbitrary nesting!
      function recurseIntoCStructArray(val) {
        if (val[0] === 'C_ARRAY') {
          $.each(val, function(ind, elt) {
            if (ind < 2) return; // these have 2 header fields
            updateCurLayoutAndRecurse(elt);
          });
        } else if (val[0] === 'C_MULTIDIMENSIONAL_ARRAY' || val[0] === 'C_STRUCT') {
          $.each(val, function(ind, kvPair) {
            if (ind < 3) return; // these have 3 header fields
            updateCurLayoutAndRecurse(kvPair[1]);
          });
        }
      }

      // iterate through all globals and ordered stack frames and call updateCurLayout
      $.each(curEntry.ordered_globals, function(i, varname) {
        var val = curEntry.globals[varname];
        if (val !== undefined) { // might not be defined at this line, which is OKAY!
          // TODO: try to unify this behavior between C/C++ and other languages:
          if (myViz.isCppMode()) {
            updateCurLayoutAndRecurse(val);
          } else {
            if (!myViz.isPrimitiveType(val)) {
              var id = getRefID(val);
              updateCurLayout(id, null, []);
            }
          }
        }
      });

      $.each(curEntry.stack_to_render, function(i, frame) {
        $.each(frame.ordered_varnames, function(xxx, varname) {
          var val = frame.encoded_locals[varname];
          // TODO: try to unify this behavior between C/C++ and other languages:
          if (myViz.isCppMode()) {
            updateCurLayoutAndRecurse(val);
          } else {
            if (!myViz.isPrimitiveType(val)) {
              var id = getRefID(val);
              updateCurLayout(id, null, []);
            }
          }
        });
      });


      // iterate through remaining elements of idsToRemove and REMOVE them from curLayout
      idsToRemove.forEach(function(id, xxx) {
        var idInt = Number(id); // keys are stored as strings, so convert!!!
        $.each(curLayout, function(rownum, row) {
          var ind = row.indexOf(idInt);
          if (ind > 0) { // remember that index 0 of the row is the row ID tag
            row.splice(ind, 1);
          }
        });
      });

      // now remove empty rows (i.e., those with only a row ID tag) from curLayout
      curLayout = curLayout.filter(function(row) {return row.length > 1});

      myViz.curTraceLayouts.push(curLayout);
    });

    this.curTraceLayouts.splice(0, 1); // remove seeded empty sentinel element
    assert (this.curTrace.length == this.curTraceLayouts.length);
  }

  // is this visualizer in C or C++ mode? the eventual goal is to remove
  // this special-case kludge check altogether and have the entire
  // codebase be unified. but for now, keep C/C++ separate because I don't
  // want to risk screwing up the visualizations for the other languages
  isCppMode() {
    return (this.params.lang === 'c' || this.params.lang === 'cpp');
  }

  // compare two JSON-encoded compound objects for structural equivalence:
  structurallyEquivalent(obj1, obj2) {
    // punt if either isn't a compound type
    if (this.isPrimitiveType(obj1) || this.isPrimitiveType(obj2)) {
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
        startingInd = 1;
      }
      else if (obj1[0] == 'INSTANCE') {
        startingInd = 2;
      }
      else if (obj1[0] == 'INSTANCE_PPRINT') {
        startingInd = 3;
      }
      else {
        return false; // punt on all other types
      }

      var obj1fields = d3.map();

      // for a dict or object instance, same names of fields (ordering doesn't matter)
      for (var i = startingInd; i < obj1.length; i++) {
        obj1fields.set(obj1[i][0], 1); // use as a set
      }

      for (var i = startingInd; i < obj2.length; i++) {
        if (!obj1fields.has(obj2[i][0])) {
          return false;
        }
      }

      return true;
    }
  }

  isPrimitiveType(obj) {
    var hook_result = this.owner.try_hook("isPrimitiveType", {obj:obj});
    if (hook_result[0]) return hook_result[1];

    // null is a primitive
    if (obj === null) {
      return true;
    }

    if (typeof obj == "object") {
      // kludgy
      return (obj[0] == 'IMPORTED_FAUX_PRIMITIVE' ||
              obj[0] == 'SPECIAL_FLOAT' || obj[0] == 'JS_SPECIAL_VAL' ||
              obj[0] == 'C_DATA' /* TODO: is this right?!? */);
    }
    else {
      // non-objects are primitives
      return true;
    }
  }

  // This is the main event right here!!!
  //
  // The "4.0" version of renderDataStructures was refactored to be much
  // less monolithic and more modular. It was made possible by first
  // creating a suite of frontend JS regression tests so that I felt more
  // comfortable mucking around with the super-brittle code in this
  // function. This version was created in April 2014. For reference,
  // before refactoring, this function was 1,030 lines of convoluted code!
  //
  // (Also added the rightward nudge hack to make tree-like structures
  // look more sane without any sophisticated graph rendering code. Thanks
  // to John DeNero for this suggestion all the way back in Fall 2012.)
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
  renderDataStructures(curInstr: number) {
    var myViz = this; // to prevent confusion of 'this' inside of nested functions

    var curEntry = this.curTrace[curInstr];
    var curToplevelLayout = this.curTraceLayouts[curInstr];

    myViz.resetJsPlumbManager(); // very important!!!

    // for simplicity (but sacrificing some performance), delete all
    // connectors and redraw them from scratch. doing so avoids mysterious
    // jsPlumb connector alignment issues when the visualizer's enclosing
    // div contains, say, a "position: relative;" CSS tag
    // (which happens in the IPython Notebook)
    var existingConnectionEndpointIDs = d3.map();
    myViz.jsPlumbInstance.select({scope: 'varValuePointer'}).each(function(c) {
      // This is VERY crude, but to prevent multiple redundant HEAP->HEAP
      // connectors from being drawn with the same source and origin, we need to first
      // DELETE ALL existing HEAP->HEAP connections, and then re-render all of
      // them in each call to this function. The reason why we can't safely
      // hold onto them is because there's no way to guarantee that the
      // *__heap_pointer_src_<src id> IDs are consistent across execution points.
      //
      // thus, only add to existingConnectionEndpointIDs if this is NOT heap->heap
      if (!c.sourceId.match(heapPtrSrcRE)) {
        existingConnectionEndpointIDs.set(c.sourceId, c.targetId);
      }
    });

    var existingParentPointerConnectionEndpointIDs = d3.map();
    myViz.jsPlumbInstance.select({scope: 'frameParentPointer'}).each(function(c) {
      existingParentPointerConnectionEndpointIDs.set(c.sourceId, c.targetId);
    });


    // Heap object rendering phase:

    // count everything in curToplevelLayout as already rendered since we will render them
    // in d3 .each() statements
    $.each(curToplevelLayout, function(xxx, row) {
      for (var i = 0; i < row.length; i++) {
        var objID = row[i];
        var heapObjID = myViz.generateHeapObjID(objID, curInstr);
        myViz.jsPlumbManager.renderedHeapObjectIDs.set(heapObjID, 1);
      }
    });

    // use d3 to render the heap by mapping curToplevelLayout into <table class="heapRow">
    // and <td class="toplevelHeapObject"> elements

    // for simplicity, CLEAR this entire div every time, which totally
    // gets rid of the incremental benefits of using d3 for, say,
    // transitions or efficient updates. but it provides more
    // deterministic and predictable output for other functions. sigh, i'm
    // not really using d3 to the fullest, but oh wells!
    myViz.domRoot.find('#heap')
      .empty()
      .html(`<div id="heapHeader">${myViz.getRealLabel("Objects")}</div>`);


    var heapRows = myViz.domRootD3.select('#heap')
      .selectAll('table.heapRow')
      .attr('id', function(d, i){ return 'heapRow' + i; }) // add unique ID
      .data(curToplevelLayout, function(objLst) {
        return objLst[0]; // return first element, which is the row ID tag
    });


    // insert new heap rows
    heapRows.enter().append('table')
      //.each(function(objLst, i) {console.log('NEW ROW:', objLst, i);})
      .attr('id', function(d, i){ return 'heapRow' + i; }) // add unique ID
      .attr('class', 'heapRow');

    // delete a heap row
    var hrExit = heapRows.exit();
    hrExit
      .each(function(d, idx) {
        //console.log('DEL ROW:', d, idx);
        $(this).empty(); // crucial for garbage collecting jsPlumb connectors!
      })
      .remove();


    // update an existing heap row
    var toplevelHeapObjects = heapRows
      //.each(function(objLst, i) { console.log('UPDATE ROW:', objLst, i); })
      .selectAll('td.toplevelHeapObject')
      .data(function(d, i) {return d.slice(1, d.length);}, /* map over each row, skipping row ID tag */
            function(objID) {return objID;} /* each object ID is unique for constancy */);

    // insert a new toplevelHeapObject
    var tlhEnter = toplevelHeapObjects.enter().append('td')
      .attr('class', 'toplevelHeapObject')
      .attr('id', function(d, i) {return 'toplevel_heap_object_' + d;});

    // remember that the enter selection is added to the update
    // selection so that we can process it later ...

    // update a toplevelHeapObject
    toplevelHeapObjects
      .order() // VERY IMPORTANT to put in the order corresponding to data elements
      .each(function(objID, i) {
        //console.log('NEW/UPDATE ELT', objID);

        // TODO: add a smoother transition in the future
        // Right now, just delete the old element and render a new one in its place
        $(this).empty();

        if (myViz.isCppMode()) {
          // TODO: why might this be undefined?!? because the object
          // disappeared from the heap all of a sudden?!?
          if (curEntry.heap[objID] !== undefined) {
            myViz.renderCompoundObject(objID, curInstr, $(this), true);
          }
        } else {
          myViz.renderCompoundObject(objID, curInstr, $(this), true);
        }
      });

    // delete a toplevelHeapObject
    var tlhExit = toplevelHeapObjects.exit();
    tlhExit
      .each(function(d, idx) {
        $(this).empty(); // crucial for garbage collecting jsPlumb connectors!
      })
      .remove();


    // Render globals and then stack frames using d3:


    // TODO: this sometimes seems buggy on Safari, so nix it for now:
    function highlightAliasedConnectors(d, i) {
      // if this row contains a stack pointer, then highlight its arrow and
      // ALL aliases that also point to the same heap object
      var stackPtrId = $(this).find('div.stack_pointer').attr('id');
      if (stackPtrId) {
        var foundTargetId = null;
        myViz.jsPlumbInstance.select({source: stackPtrId}).each(function(c) {foundTargetId = c.targetId;});

        // use foundTargetId to highlight ALL ALIASES
        myViz.jsPlumbInstance.select().each(function(c) {
          if (c.targetId == foundTargetId) {
            c.setHover(true);
            $(c.canvas).css("z-index", 2000); // ... and move it to the VERY FRONT
          }
          else {
            c.setHover(false);
          }
        });
      }
    }

    function unhighlightAllConnectors(d, i) {
      myViz.jsPlumbInstance.select().each(function(c) {
        c.setHover(false);
      });
    }


    // TODO: coalesce code for rendering globals and stack frames,
    // since there's so much copy-and-paste grossness right now

    // render all global variables IN THE ORDER they were created by the program,
    // in order to ensure continuity:

    // Derive a list where each element contains varname
    // as long as value is NOT undefined.
    // (Sometimes entries in curEntry.ordered_globals are undefined,
    // so filter those out.)
    var realGlobalsLst = [];
    $.each(curEntry.ordered_globals, function(i, varname) {
      var val = curEntry.globals[varname];

      // (use '!==' to do an EXACT match against undefined)
      if (val !== undefined) { // might not be defined at this line, which is OKAY!
        realGlobalsLst.push(varname);
      }
    });

    var globalsID = myViz.owner.generateID('globals');
    var globalTblID = myViz.owner.generateID('global_table');

    var globalVarTable = myViz.domRootD3.select('#' + globalTblID)
      .selectAll('tr')
      .data(realGlobalsLst,
            function(d) {return d;} // use variable name as key
      );

    globalVarTable
      .enter()
      .append('tr')
      .attr('class', 'variableTr')
      .attr('id', function(d, i) {
          return myViz.owner.generateID(varnameToCssID('global__' + d + '_tr')); // make globally unique (within the page)
      });


    var globalVarTableCells = globalVarTable
      .selectAll('td.stackFrameVar,td.stackFrameValue')
      .data(function(d, i){return [d, d];}) /* map varname down both columns */

    globalVarTableCells.enter()
      .append('td')
      .attr('class', function(d, i) {return (i == 0) ? 'stackFrameVar' : 'stackFrameValue';});

    // remember that the enter selection is added to the update
    // selection so that we can process it later ...

    // UPDATE
    globalVarTableCells
      .order() // VERY IMPORTANT to put in the order corresponding to data elements
      .each(function(varname, i) {
        if (i == 0) {
          $(this).html(varname);
        }
        else {
          // always delete and re-render the global var ...
          // NB: trying to cache and compare the old value using,
          // say -- $(this).attr('data-curvalue', valStringRepr) -- leads to
          // a mysterious and killer memory leak that I can't figure out yet
          $(this).empty();

          // make sure varname doesn't contain any weird
          // characters that are illegal for CSS ID's ...
          var varDivID = myViz.owner.generateID('global__' + varnameToCssID(varname));

          // need to get rid of the old connector in preparation for rendering a new one:
          existingConnectionEndpointIDs.remove(varDivID);

          var val = curEntry.globals[varname];
          if (myViz.isPrimitiveType(val)) {
            myViz.renderPrimitiveObject(val, curInstr, $(this));
          }
          else if (val[0] === 'C_STRUCT' || val[0] === 'C_ARRAY' || val[0] === 'C_MULTIDIMENSIONAL_ARRAY') {
            // C structs and arrays can be inlined in frames
            myViz.renderCStructArray(val, curInstr, $(this));
          }
          else {
            var heapObjID = myViz.generateHeapObjID(getRefID(val), curInstr);

            if (myViz.params.textualMemoryLabels) {
              var labelID = varDivID + '_text_label';
              $(this).append('<div class="objectIdLabel" id="' + labelID + '">id' + getRefID(val) + '</div>');
              $(this).find('div#' + labelID).hover(
                function() {
                  myViz.jsPlumbInstance.connect({source: labelID, target: heapObjID,
                                                 scope: 'varValuePointer'});
                },
                function() {
                  myViz.jsPlumbInstance.select({source: labelID}).detach();
                });
            }
            else {
              // add a stub so that we can connect it with a connector later.
              // IE needs this div to be NON-EMPTY in order to properly
              // render jsPlumb endpoints, so that's why we add an "&nbsp;"!
              $(this).append('<div class="stack_pointer" id="' + varDivID + '">&nbsp;</div>');

              assert(!myViz.jsPlumbManager.connectionEndpointIDs.has(varDivID));
              myViz.jsPlumbManager.connectionEndpointIDs.set(varDivID, heapObjID);
              //console.log('STACK->HEAP', varDivID, heapObjID);
            }
          }
        }
      });



    globalVarTableCells.exit()
      .each(function(d, idx) {
        $(this).empty(); // crucial for garbage collecting jsPlumb connectors!
      })
      .remove();

    globalVarTable.exit()
      .each(function(d, i) {
        // detach all stack_pointer connectors for divs that are being removed
        $(this).find('.stack_pointer').each(function(i, sp) {
          existingConnectionEndpointIDs.remove($(sp).attr('id'));
        });

        $(this).empty(); // crucial for garbage collecting jsPlumb connectors!
      })
      .remove();


    // for aesthetics, hide globals if there aren't any globals to display
    if (curEntry.ordered_globals.length == 0) {
      this.domRoot.find('#' + globalsID).hide();
    }
    else {
      this.domRoot.find('#' + globalsID).show();
    }


    // holy cow, the d3 code for stack rendering is ABSOLUTELY NUTS!

    var stackDiv = myViz.domRootD3.select('#stack');

    // VERY IMPORTANT for selectAll selector to be SUPER specific here!
    var stackFrameDiv = stackDiv.selectAll('div.stackFrame,div.zombieStackFrame')
      .data(curEntry.stack_to_render, function(frame) {
        // VERY VERY VERY IMPORTANT for properly handling closures and nested functions
        // (see the backend code for more details)
        return frame.unique_hash;
      });

    var sfdEnter = stackFrameDiv.enter()
      .append('div')
      .attr('class', function(d, i) {return d.is_zombie ? 'zombieStackFrame' : 'stackFrame';})
      .attr('id', function(d, i) {return d.is_zombie ? myViz.owner.generateID("zombie_stack" + i)
                                                     : myViz.owner.generateID("stack" + i);
      })
      // HTML5 custom data attributes
      .attr('data-frame_id', function(frame, i) {return frame.frame_id;})
      .attr('data-parent_frame_id', function(frame, i) {
        return (frame.parent_frame_id_list.length > 0) ? frame.parent_frame_id_list[0] : null;
      })
      .each(function(frame, i) {
        if (!myViz.params.drawParentPointers) {
          return;
        }
        // only run if myViz.params.drawParentPointers is true ...

        var my_CSS_id = $(this).attr('id');

        //console.log(my_CSS_id, 'ENTER');

        // render a parent pointer whose SOURCE node is this frame
        // i.e., connect this frame to p, where this.parent_frame_id == p.frame_id
        // (if this.parent_frame_id is null, then p is the global frame)
        if (frame.parent_frame_id_list.length > 0) {
          var parent_frame_id = frame.parent_frame_id_list[0];
          // tricky turkey!
          // ok this hack just HAPPENS to work by luck ... usually there will only be ONE frame
          // that matches this selector, but sometimes multiple frames match, in which case the
          // FINAL frame wins out (since parentPointerConnectionEndpointIDs is a map where each
          // key can be mapped to only ONE value). it so happens that the final frame winning
          // out looks "desirable" for some of the closure test cases that I've tried. but
          // this code is quite brittle :(
          myViz.domRoot.find('div#stack [data-frame_id=' + parent_frame_id + ']').each(function(i, e) {
            var parent_CSS_id = $(this).attr('id');
            //console.log('connect', my_CSS_id, parent_CSS_id);
            myViz.jsPlumbManager.parentPointerConnectionEndpointIDs.set(my_CSS_id, parent_CSS_id);
          });
        }
        else {
          // render a parent pointer to the global frame
          //console.log('connect', my_CSS_id, globalsID);
          // only do this if there are actually some global variables to display ...
          if (curEntry.ordered_globals.length > 0) {
            myViz.jsPlumbManager.parentPointerConnectionEndpointIDs.set(my_CSS_id, globalsID);
          }
        }

        // tricky turkey: render parent pointers whose TARGET node is this frame.
        // i.e., for all frames f such that f.parent_frame_id == my_frame_id,
        // connect f to this frame.
        // (make sure not to confuse frame IDs with CSS IDs!!!)
        var my_frame_id = frame.frame_id;
        myViz.domRoot.find('div#stack [data-parent_frame_id=' + my_frame_id + ']').each(function(i, e) {
          var child_CSS_id = $(this).attr('id');
          //console.log('connect', child_CSS_id, my_CSS_id);
          myViz.jsPlumbManager.parentPointerConnectionEndpointIDs.set(child_CSS_id, my_CSS_id);
        });
      });

    sfdEnter
      .append('div')
      .attr('class', 'stackFrameHeader')
      .html(function(frame, i) {

        // pretty-print lambdas and display other weird characters
        // (might contain '<' or '>' for weird names like <genexpr>)
        var funcName = htmlspecialchars(frame.func_name).replace('&lt;lambda&gt;', '\u03bb');

        var headerLabel = funcName;

        // only display if you're someone's parent (unless showAllFrameLabels)
        if (frame.is_parent || myViz.params.showAllFrameLabels) {
          headerLabel = 'f' + frame.frame_id + ': ' + headerLabel;
        }

        // optional (btw, this isn't a CSS id)
        if (frame.parent_frame_id_list.length > 0) {
          var parentFrameID = frame.parent_frame_id_list[0];
          headerLabel = headerLabel + ' [parent=f' + parentFrameID + ']';
        }
        else if (myViz.params.showAllFrameLabels) {
          headerLabel = headerLabel + ' [parent=Global]';
        }

        return headerLabel;
      });

    sfdEnter
      .append('table')
      .attr('class', 'stackFrameVarTable');


    var stackVarTable = stackFrameDiv
      .order() // VERY IMPORTANT to put in the order corresponding to data elements
      .select('table').selectAll('tr')
      .data(function(frame) {
          // each list element contains a reference to the entire frame
          // object as well as the variable name
          // TODO: look into whether we can use d3 parent nodes to avoid
          // this hack ... http://bost.ocks.org/mike/nest/
          return frame.ordered_varnames.map(function(varname) {return {varname:varname, frame:frame};});
        },
        function(d) {
          // TODO: why would d ever be null?!? weird
          if (d) {
            return d.varname; // use variable name as key
          }
        }
      );

    stackVarTable
      .enter()
      .append('tr')
      .attr('class', 'variableTr')
      .attr('id', function(d, i) {
          return myViz.owner.generateID(varnameToCssID(d.frame.unique_hash + '__' + d.varname + '_tr')); // make globally unique (within the page)
      });


    var stackVarTableCells = stackVarTable
      .selectAll('td.stackFrameVar,td.stackFrameValue')
      .data(function(d, i) {return [d, d] /* map identical data down both columns */;});

    stackVarTableCells.enter()
      .append('td')
      .attr('class', function(d, i) {return (i == 0) ? 'stackFrameVar' : 'stackFrameValue';});

    stackVarTableCells
      .order() // VERY IMPORTANT to put in the order corresponding to data elements
      .each(function(d, i) {
        var varname = d.varname;
        var frame = d.frame;

        if (i == 0) {
          if (varname == '__return__')
            $(this).html('<span class="retval">Return<br/>value</span>');
          else
            $(this).html(varname);
        }
        else {
          // always delete and re-render the stack var ...
          // NB: trying to cache and compare the old value using,
          // say -- $(this).attr('data-curvalue', valStringRepr) -- leads to
          // a mysterious and killer memory leak that I can't figure out yet
          $(this).empty();

          // make sure varname and frame.unique_hash don't contain any weird
          // characters that are illegal for CSS ID's ...
          var varDivID = myViz.owner.generateID(varnameToCssID(frame.unique_hash + '__' + varname));

          // need to get rid of the old connector in preparation for rendering a new one:
          existingConnectionEndpointIDs.remove(varDivID);

          var val = frame.encoded_locals[varname];
          if (myViz.isPrimitiveType(val)) {
            myViz.renderPrimitiveObject(val, curInstr, $(this));
          }
          else if (val[0] === 'C_STRUCT' || val[0] === 'C_ARRAY' || val[0] === 'C_MULTIDIMENSIONAL_ARRAY') {
            // C structs and arrays can be inlined in frames
            myViz.renderCStructArray(val, curInstr, $(this));
          }
          else {
            var heapObjID = myViz.generateHeapObjID(getRefID(val), curInstr);
            if (myViz.params.textualMemoryLabels) {
              var labelID = varDivID + '_text_label';
              $(this).append('<div class="objectIdLabel" id="' + labelID + '">id' + getRefID(val) + '</div>');
              $(this).find('div#' + labelID).hover(
                function() {
                  myViz.jsPlumbInstance.connect({source: labelID, target: heapObjID,
                                                 scope: 'varValuePointer'});
                },
                function() {
                  myViz.jsPlumbInstance.select({source: labelID}).detach();
                });
            }
            else {
              // add a stub so that we can connect it with a connector later.
              // IE needs this div to be NON-EMPTY in order to properly
              // render jsPlumb endpoints, so that's why we add an "&nbsp;"!
              $(this).append('<div class="stack_pointer" id="' + varDivID + '">&nbsp;</div>');

              assert(!myViz.jsPlumbManager.connectionEndpointIDs.has(varDivID));
              myViz.jsPlumbManager.connectionEndpointIDs.set(varDivID, heapObjID);
              //console.log('STACK->HEAP', varDivID, heapObjID);
            }
          }
        }
      });


    stackVarTableCells.exit()
      .each(function(d, idx) {
        $(this).empty(); // crucial for garbage collecting jsPlumb connectors!
      })
     .remove();

    stackVarTable.exit()
      .each(function(d, i) {
        $(this).find('.stack_pointer').each(function(i, sp) {
          // detach all stack_pointer connectors for divs that are being removed
          existingConnectionEndpointIDs.remove($(sp).attr('id'));
        });

        $(this).empty(); // crucial for garbage collecting jsPlumb connectors!
      })
      .remove();

    stackFrameDiv.exit()
      .each(function(frame, i) {
        $(this).find('.stack_pointer').each(function(i, sp) {
          // detach all stack_pointer connectors for divs that are being removed
          existingConnectionEndpointIDs.remove($(sp).attr('id'));
        });

        var my_CSS_id = $(this).attr('id');

        //console.log(my_CSS_id, 'EXIT');

        // Remove all pointers where either the source or destination end is my_CSS_id
        existingParentPointerConnectionEndpointIDs.forEach(function(k, v) {
          if (k == my_CSS_id || v == my_CSS_id) {
            //console.log('remove EPP', k, v);
            existingParentPointerConnectionEndpointIDs.remove(k);
          }
        });

        $(this).empty(); // crucial for garbage collecting jsPlumb connectors!
      })
      .remove();


    // Rightward nudge hack to make tree-like structures look more sane
    // without any sophisticated graph rendering code. Thanks to John
    // DeNero for this suggestion in Fall 2012.
    //
    // This hack tries to ensure that all pointers that span different
    // rows point RIGHTWARD (as much as possible), which makes tree-like
    // structures look decent. e.g.,:
    //
    // t = [[['a', 'b'], ['c', 'd']], [[1,2], [3,4]]]
    //
    // Do it here since all of the divs have been rendered by now, but no
    // jsPlumb arrows have been rendered yet.
    if (rightwardNudgeHack) {
      // Basic idea: keep a set of all nudged ROWS for each nudger row, so
      // that when you get nudged, you can, in turn, nudge all of the rows
      // that you've nudged. this algorithm nicely takes care of the fact
      // that there might not be cycles in objects that you've nudged, but
      // there are cycles in entire rows.
      //
      // Key:   ID of .heapRow object that did the nudging
      // Value: set of .heapRow ID that were (transitively) nudged by this element
      //        (represented as a d3.map)
      var nudger_to_nudged_rows = {};

      // VERY IMPORTANT to sort these connector IDs in ascending order,
      // since I think they're rendered left-to-right, top-to-bottom in ID
      // order, so we want to run the nudging algorithm in that same order.
      var srcHeapConnectorIDs = myViz.jsPlumbManager.heapConnectionEndpointIDs.keys();
      srcHeapConnectorIDs.sort();

      $.each(srcHeapConnectorIDs, function(i, srcID) {
        var dstID = myViz.jsPlumbManager.heapConnectionEndpointIDs.get(srcID);

        var srcAnchorObject = myViz.domRoot.find('#' + srcID);
        var srcHeapObject = srcAnchorObject.closest('.heapObject');
        var dstHeapObject = myViz.domRoot.find('#' + dstID);
        assert(dstHeapObject.attr('class') == 'heapObject');

        var srcHeapRow = srcHeapObject.closest('.heapRow');
        var dstHeapRow = dstHeapObject.closest('.heapRow');

        var srcRowID = srcHeapRow.attr('id');
        var dstRowID = dstHeapRow.attr('id');

        // only consider nudging if srcID and dstID are on different rows
        if (srcRowID != dstRowID) {
          var srcAnchorLeft = srcAnchorObject.offset().left;
          var srcHeapObjectLeft = srcHeapObject.offset().left;
          var dstHeapObjectLeft = dstHeapObject.offset().left;

          // if srcAnchorObject is to the RIGHT of dstHeapObject, then nudge
          // dstHeapObject to the right
          if (srcAnchorLeft > dstHeapObjectLeft) {
            // an extra nudge of 32px matches up pretty well with the
            // current CSS padding around .toplevelHeapObject
            var delta = (srcAnchorLeft - dstHeapObjectLeft) + 32;

            // set margin rather than padding so that arrows tips still end
            // at the left edge of the element.
            // whoa, set relative CSS using +=, nice!
            dstHeapObject.css('margin-left', '+=' + delta);

            //console.log(srcRowID, 'nudged', dstRowID, 'by', delta);

            var cur_nudgee_set = nudger_to_nudged_rows[srcRowID];
            if (cur_nudgee_set === undefined) {
              cur_nudgee_set = d3.map();
              nudger_to_nudged_rows[srcRowID] = cur_nudgee_set;
            }
            cur_nudgee_set.set(dstRowID, 1 /* useless value */);

            // now if dstRowID itself nudged some other nodes, then nudge
            // all of its nudgees by delta as well
            var dst_nudgee_set = nudger_to_nudged_rows[dstRowID];
            if (dst_nudgee_set) {
              dst_nudgee_set.forEach(function(k, v) {
                // don't nudge if it's yourself, to make cycles look
                // somewhat reasonable (although still not ideal). e.g.,:
                //   x = [1,2]
                //   y = [3,x]
                //   x[1] = y
                if (k != srcRowID) {
                  // nudge this entire ROW by delta as well
                  myViz.domRoot.find('#' + k).css('margin-left', '+=' + delta);

                  // then transitively add to entry for srcRowID
                  cur_nudgee_set.set(k, 1 /* useless value */);
                }
              });
            }
          }
        }
      });
    }


    // NB: ugh, I'm not very happy about this hack, but it seems necessary
    // for embedding within sophisticated webpages such as IPython Notebook

    // delete all connectors. do this AS LATE AS POSSIBLE so that
    // (presumably) the calls to $(this).empty() earlier in this function
    // will properly garbage collect the connectors
    //
    // WARNING: for environment parent pointers, garbage collection doesn't seem to
    // be working as intended :(
    //
    // I suspect that this is due to the fact that parent pointers are SIBLINGS
    // of stackFrame divs and not children, so when stackFrame divs get destroyed,
    // their associated parent pointers do NOT.)
    myViz.jsPlumbInstance.reset();


    // use jsPlumb scopes to keep the different kinds of pointers separated
    function renderVarValueConnector(varID, valueID) {
      // special-case handling for C/C++ pointers, just to keep from rocking
      // the boat on my existing (battle-tested) code
      if (myViz.isCppMode()) {
        if (myViz.domRoot.find('#' + valueID).length) {
          myViz.jsPlumbInstance.connect({source: varID, target: valueID, scope: 'varValuePointer'});
        } else {
          // pointer isn't pointing to anything valid; put a poo emoji here
          myViz.domRoot.find('#' + varID).html('\uD83D\uDCA9' /* pile of poo emoji */);
        }
      } else {
        myViz.jsPlumbInstance.connect({source: varID, target: valueID, scope: 'varValuePointer'});
      }
    }


    var totalParentPointersRendered = 0;

    function renderParentPointerConnector(srcID, dstID) {
      // SUPER-DUPER-ugly hack since I can't figure out a cleaner solution for now:
      // if either srcID or dstID no longer exists, then SKIP rendering ...
      if ((myViz.domRoot.find('#' + srcID).length == 0) ||
          (myViz.domRoot.find('#' + dstID).length == 0)) {
        return;
      }

      //console.log('renderParentPointerConnector:', srcID, dstID);

      myViz.jsPlumbInstance.connect({source: srcID, target: dstID,
                                     anchors: ["LeftMiddle", "LeftMiddle"],

                                     // 'horizontally offset' the parent pointers up so that they don't look as ugly ...
                                     //connector: ["Flowchart", { stub: 9 + (6 * (totalParentPointersRendered + 1)) }],

                                     // actually let's try a bezier curve ...
                                     connector: [ "Bezier", { curviness: 45 }],

                                     endpoint: ["Dot", {radius: 4}],
                                     //hoverPaintStyle: {lineWidth: 1, strokeStyle: connectorInactiveColor}, // no hover colors
                                     scope: 'frameParentPointer'});
      totalParentPointersRendered++;
    }

    if (!myViz.params.textualMemoryLabels) {
      // re-render existing connectors and then ...
      //
      // NB: in C/C++ mode, to keep things simple, don't try to redraw
      // existingConnectionEndpointIDs since we want to redraw all arrows
      // each and every time.
      if (!myViz.isCppMode()) {
        existingConnectionEndpointIDs.forEach(renderVarValueConnector);
      }
      // add all the NEW connectors that have arisen in this call to renderDataStructures
      myViz.jsPlumbManager.connectionEndpointIDs.forEach(renderVarValueConnector);
    }
    // do the same for environment parent pointers
    if (myViz.params.drawParentPointers) {
      existingParentPointerConnectionEndpointIDs.forEach(renderParentPointerConnector);
      myViz.jsPlumbManager.parentPointerConnectionEndpointIDs.forEach(renderParentPointerConnector);
    }

    /*
    myViz.jsPlumbInstance.select().each(function(c) {
      console.log('CONN:', c.sourceId, c.targetId);
    });
    */
    //console.log('---', myViz.jsPlumbInstance.select().length, '---');


    function highlight_frame(frameID) {
      myViz.jsPlumbInstance.select().each(function(c) {
        // find the enclosing .stackFrame ...
        var stackFrameDiv = c.source.closest('.stackFrame');

        // if this connector starts in the selected stack frame ...
        if (stackFrameDiv.attr('id') == frameID) {
          // then HIGHLIGHT IT!
          c.setPaintStyle({lineWidth:1, strokeStyle: connectorBaseColor});
          c.endpoints[0].setPaintStyle({fillStyle: connectorBaseColor});
          //c.endpoints[1].setVisible(false, true, true); // JUST set right endpoint to be invisible

          $(c.canvas).css("z-index", 1000); // ... and move it to the VERY FRONT
        }
        // for heap->heap connectors
        else if (myViz.jsPlumbManager.heapConnectionEndpointIDs.has(c.endpoints[0].elementId)) {
          // NOP since it's already the color and style we set by default
        }
        // TODO: maybe this needs special consideration for C/C++ code? dunno
        else if (stackFrameDiv.length > 0) {
          // else unhighlight it
          // (only if c.source actually belongs to a stackFrameDiv (i.e.,
          //  it originated from the stack). for instance, in C there are
          //  heap pointers, but we doen't use heapConnectionEndpointIDs)
          c.setPaintStyle({lineWidth:1, strokeStyle: connectorInactiveColor});
          c.endpoints[0].setPaintStyle({fillStyle: connectorInactiveColor});
          //c.endpoints[1].setVisible(false, true, true); // JUST set right endpoint to be invisible

          $(c.canvas).css("z-index", 0);
        }
      });


      // clear everything, then just activate this one ...
      myViz.domRoot.find(".stackFrame").removeClass("highlightedStackFrame");
      myViz.domRoot.find('#' + frameID).addClass("highlightedStackFrame");
    }


    // highlight the top-most non-zombie stack frame or, if not available, globals
    var frame_already_highlighted = false;
    $.each(curEntry.stack_to_render, function(i, e) {
      if (e.is_highlighted) {
        highlight_frame(myViz.owner.generateID('stack' + i));
        frame_already_highlighted = true;
      }
    });

    if (!frame_already_highlighted) {
      highlight_frame(myViz.owner.generateID('globals'));
    }

    myViz.owner.try_hook("end_renderDataStructures", {myViz:myViz.owner /* tricky! use owner to be safe */});
  }

  // rendering functions, which all take a d3 dom element to anchor the
  // new element to render
  renderPrimitiveObject(obj, stepNum: number, d3DomElement) {
    var myViz = this; // to prevent confusion of 'this' inside of nested functions

    if (this.owner.try_hook("renderPrimitiveObject", {obj:obj, d3DomElement:d3DomElement})[0])
      return;

    var typ = typeof obj;

    if (obj == null) {
      d3DomElement.append('<span class="nullObj">' + this.getRealLabel('None') + '</span>');
    }
    else if (typ == "number") {
      d3DomElement.append('<span class="numberObj">' + obj + '</span>');
    }
    else if (typ == "boolean") {
      if (obj) {
        d3DomElement.append('<span class="boolObj">' + this.getRealLabel('True') + '</span>');
      }
      else {
        d3DomElement.append('<span class="boolObj">' + this.getRealLabel('False') + '</span>');
      }
    }
    else if (typ == "string") {
      // escape using htmlspecialchars to prevent HTML/script injection
      var literalStr = htmlspecialchars(obj);

      // print as a double-quoted string literal
      literalStr = literalStr.replace(doubleQuoteAllRegex, '\\"'); // replace ALL
      literalStr = '"' + literalStr + '"';

      d3DomElement.append('<span class="stringObj">' + literalStr + '</span>');
    }
    else if (typ == "object") {
      if (obj[0] == 'C_DATA') {
        var typeName = obj[2];
        // special cases for brevity:
        if (typeName === 'short int') {
          typeName = 'short';
        } else if (typeName === 'short unsigned int') {
          typeName = 'unsigned short';
        } else if (typeName === 'long int') {
          typeName = 'long';
        } else if (typeName === 'long long int') {
          typeName = 'long long';
        } else if (typeName === 'long unsigned int') {
          typeName = 'unsigned long';
        } else if (typeName === 'long long unsigned int') {
          typeName = 'unsigned long long int';
        }

        var isValidPtr = ((typeName === 'pointer') &&
                          (obj[3] !== '<UNINITIALIZED>') &&
                          (obj[3] !== '<UNALLOCATED>'));

        var addr = obj[1];
        var leader = '';

        // prefix with 'cdata_' so that we can distinguish this from a
        // top-level heap ID generated by generateHeapObjID
        var cdataId = myViz.generateHeapObjID('cdata_' + addr, stepNum);

        if (isValidPtr) {
          // for pointers, put cdataId in the header
          d3DomElement.append('<div id="' + cdataId + '" class="cdataHeader">' + leader + typeName + '</div>');

          var ptrVal = obj[3];

          // add a stub so that we can connect it with a connector later.
          // IE needs this div to be NON-EMPTY in order to properly
          // render jsPlumb endpoints, so that's why we add an "&nbsp;"!
          var ptrSrcId = myViz.generateHeapObjID('ptrSrc_' + addr, stepNum);
          var ptrTargetId = myViz.generateHeapObjID('cdata_' + ptrVal, stepNum); // don't forget cdata_ prefix!

          var debugInfo = '';

          // make it really narrow so that the div doesn't STRETCH too wide
          d3DomElement.append('<div style="width: 10px;" id="' + ptrSrcId + '" class="cdataElt">&nbsp;' + debugInfo + '</div>');

          // special case: display 0x0 address as a NULL pointer value,
          // to distinguish it from all other pointers, since sometimes
          // C/C++ programmers *explicitly* set a pointer to null
          if (ptrVal === '0x0') {
            $('#' + ptrSrcId).html('<span class="cdataUninit">NULL</span>');
          } else {
            //console.log(ptrSrcId, '->', ptrTargetId);
            assert(!myViz.jsPlumbManager.connectionEndpointIDs.has(ptrSrcId));
            myViz.jsPlumbManager.connectionEndpointIDs.set(ptrSrcId, ptrTargetId);
          }
        } else {
          // for non-pointers, put cdataId on the element itself, so that
          // pointers can point directly at the element, not the header
          d3DomElement.append('<div class="cdataHeader">' + leader + typeName + '</div>');

          var rep = '';
          if (typeof obj[3] === 'string') {
            var literalStr = obj[3];
            if (literalStr === '<UNINITIALIZED>') {
              rep = '<span class="cdataUninit">?</span>';
              //rep = '\uD83D\uDCA9'; // pile of poo emoji
            } else if (literalStr == '<UNALLOCATED>') {
              rep = '\uD83D\uDC80'; // skull emoji
            } else {
              // a regular string
              literalStr = literalStr.replace(newlineAllRegex, '\\n'); // replace ALL
              literalStr = literalStr.replace(tabAllRegex, '\\t'); // replace ALL
              literalStr = literalStr.replace(doubleQuoteAllRegex, '\\"'); // replace ALL

              // unprintable chars are denoted with '???', so show them as
              // a special unicode character:
              if (typeName === 'char' && literalStr === '???') {
                literalStr = '\uFFFD'; // question mark in black diamond unicode character
              } else {
                // print as a SINGLE-quoted string literal (to emulate C-style chars)
                literalStr = "'" + literalStr + "'";
              }
              rep = htmlspecialchars(literalStr);
            }
          } else {
            rep = htmlspecialchars(obj[3]);
          }

          d3DomElement.append('<div id="' + cdataId + '" class="cdataElt">' + rep + '</div>');
        }
      } else if (obj[0] == 'IMPORTED_FAUX_PRIMITIVE') {
        // these represent objects that you've imported from external
        // libraries/modules, which should be displayed as 'primitives'
        // so that we don't clutter up the display by dedicating heap
        // space for them or trying to recurse into viewing their insides
        d3DomElement.append('<span class="importedObj">' + obj[1] + '</span>');
      } else {
        assert(obj[0] == 'SPECIAL_FLOAT' || obj[0] == 'JS_SPECIAL_VAL');
        d3DomElement.append('<span class="numberObj">' + obj[1] + '</span>');
      }
    }
    else {
      assert(false);
    }
  }

  renderNestedObject(obj, stepNum: number, d3DomElement) {
    if (this.isPrimitiveType(obj)) {
      this.renderPrimitiveObject(obj, stepNum, d3DomElement);
    }
    else {
      if (obj[0] === 'REF') {
        // obj is a ["REF", <int>] so dereference the 'pointer' to render that object
        this.renderCompoundObject(getRefID(obj), stepNum, d3DomElement, false);
      } else {
        assert(obj[0] === 'C_STRUCT' || obj[0] === 'C_ARRAY' || obj[0] === 'C_MULTIDIMENSIONAL_ARRAY');
        this.renderCStructArray(obj, stepNum, d3DomElement);
      }
    }
  }

  renderCompoundObject(objID, stepNum: number, d3DomElement, isTopLevel) {
    var myViz = this; // to prevent confusion of 'this' inside of nested functions

    var heapObjID = myViz.generateHeapObjID(objID, stepNum);

    if (!isTopLevel && myViz.jsPlumbManager.renderedHeapObjectIDs.has(heapObjID)) {
      var srcDivID = myViz.owner.generateID('heap_pointer_src_' + myViz.jsPlumbManager.heap_pointer_src_id);
      myViz.jsPlumbManager.heap_pointer_src_id++; // just make sure each source has a UNIQUE ID

      var dstDivID = heapObjID;

      if (myViz.params.textualMemoryLabels) {
        var labelID = srcDivID + '_text_label';
        d3DomElement.append('<div class="objectIdLabel" id="' + labelID + '">id' + objID + '</div>');

        myViz.domRoot.find('div#' + labelID).hover(
          function() {
            myViz.jsPlumbInstance.connect({source: labelID, target: dstDivID,
                                           scope: 'varValuePointer'});
          },
          function() {
            myViz.jsPlumbInstance.select({source: labelID}).detach();
          });
      }
      else {
        // render jsPlumb arrow source since this heap object has already been rendered
        // (or will be rendered soon)

        // add a stub so that we can connect it with a connector later.
        // IE needs this div to be NON-EMPTY in order to properly
        // render jsPlumb endpoints, so that's why we add an "&nbsp;"!
        d3DomElement.append('<div id="' + srcDivID + '">&nbsp;</div>');

        assert(!myViz.jsPlumbManager.connectionEndpointIDs.has(srcDivID));
        myViz.jsPlumbManager.connectionEndpointIDs.set(srcDivID, dstDivID);
        //console.log('HEAP->HEAP', srcDivID, dstDivID);

        assert(!myViz.jsPlumbManager.heapConnectionEndpointIDs.has(srcDivID));
        myViz.jsPlumbManager.heapConnectionEndpointIDs.set(srcDivID, dstDivID);
      }

      return; // early return!
    }


    // wrap ALL compound objects in a heapObject div so that jsPlumb
    // connectors can point to it:
    d3DomElement.append('<div class="heapObject" id="' + heapObjID + '"></div>');
    d3DomElement = myViz.domRoot.find('#' + heapObjID); // TODO: maybe inefficient

    myViz.jsPlumbManager.renderedHeapObjectIDs.set(heapObjID, 1);

    var curHeap = myViz.curTrace[stepNum].heap;
    var obj = curHeap[objID];
    assert($.isArray(obj));

    // prepend the type label with a memory address label
    var typeLabelPrefix = '';
    if (myViz.params.textualMemoryLabels) {
      typeLabelPrefix = 'id' + objID + ':';
    }

    var hook_result = myViz.owner.try_hook("renderCompoundObject",
                               {objID:objID, d3DomElement:d3DomElement, 
                                isTopLevel:isTopLevel, obj:obj, 
                                typeLabelPrefix:typeLabelPrefix,
                                stepNum:stepNum,
                                myViz:myViz});
    if (hook_result[0]) return;

    if (obj[0] == 'LIST' || obj[0] == 'TUPLE' || obj[0] == 'SET' || obj[0] == 'DICT') {
      var label = obj[0].toLowerCase();

      assert(obj.length >= 1);
      if (obj.length == 1) {
        d3DomElement.append('<div class="typeLabel">' + typeLabelPrefix + ' empty ' + myViz.getRealLabel(label) + '</div>');
      }
      else {
        d3DomElement.append('<div class="typeLabel">' + typeLabelPrefix + myViz.getRealLabel(label) + '</div>');
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
            myViz.renderNestedObject(val, stepNum, contentTr.find('td:last'));
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
            myViz.renderNestedObject(val, stepNum, curTr.find('td:last'));
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

            myViz.renderNestedObject(key, stepNum, keyTd);
            myViz.renderNestedObject(val, stepNum, valTd);
          });
        }
      }
    }
    else if (obj[0] == 'INSTANCE' || obj[0] == 'INSTANCE_PPRINT' || obj[0] == 'CLASS') {
      var isInstance = (obj[0] == 'INSTANCE');
      var isPprintInstance = (obj[0] == 'INSTANCE_PPRINT');
      var headerLength = isInstance ? 2 : 3;

      assert(obj.length >= headerLength);

      if (isInstance) {
        d3DomElement.append('<div class="typeLabel">' + typeLabelPrefix + obj[1] + ' ' + myViz.getRealLabel('instance') + '</div>');
      } else if (isPprintInstance) {
        d3DomElement.append('<div class="typeLabel">' + typeLabelPrefix + obj[1] + ' ' + myViz.getRealLabel('instance') + '</div>');
        d3DomElement.append('<table class="customObjTbl"><tr><td class="customObjElt">' + htmlspecialchars(obj[2]) + '</td></tr></table>');
      } else {
        var superclassStr = '';
        if (obj[2].length > 0) {
          superclassStr += ('[extends ' + obj[2].join(', ') + '] ');
        }
        d3DomElement.append('<div class="typeLabel">' + typeLabelPrefix + obj[1] + ' class ' + superclassStr +
                            '<br/>' + '<a href="javascript:void(0)" id="attrToggleLink">hide attributes</a>' + '</div>');
      }

      // right now, let's NOT display class members, since that clutters
      // up the display too much. in the future, consider displaying
      // class members in a pop-up pane on mouseover or mouseclick
      // actually nix what i just said above ...
      //if (!isInstance) return;

      if (obj.length > headerLength) {
        var lab = isInstance ? 'inst' : 'class';
        d3DomElement.append('<table class="' + lab + 'Tbl"></table>');

        var tbl = d3DomElement.children('table:last'); // tricky, there's more than 1 table if isPprintInstance is true

        $.each(obj, function(ind, kvPair) {
          if (ind < headerLength) return; // skip header tags

          tbl.append('<tr class="' + lab + 'Entry"><td class="' + lab + 'Key"></td><td class="' + lab + 'Val"></td></tr>');

          var newRow = tbl.find('tr:last');
          var keyTd = newRow.find('td:first');
          var valTd = newRow.find('td:last');

          // the keys should always be strings, so render them directly (and without quotes):
          // (actually this isn't the case when strings are rendered on the heap)
          if (typeof kvPair[0] == "string") {
            // common case ...
            var attrnameStr = htmlspecialchars(kvPair[0]);
            keyTd.append('<span class="keyObj">' + attrnameStr + '</span>');
          }
          else {
            // when strings are rendered as heap objects ...
            myViz.renderNestedObject(kvPair[0], stepNum, keyTd);
          }

          // values can be arbitrary objects, so recurse:
          myViz.renderNestedObject(kvPair[1], stepNum, valTd);
        });
      }

      // class attributes can be displayed or hidden, so as not to
      // CLUTTER UP the display with a ton of attributes, especially
      // from imported modules and custom types created from, say,
      // collections.namedtuple
      if (!isInstance) {
        var className = obj[1];
        d3DomElement.find('.typeLabel #attrToggleLink').click(function() {
          var elt = d3DomElement.find('.classTbl');
          elt.toggle();
          $(this).html((elt.is(':visible') ? 'hide' : 'show') + ' attributes');

          if (elt.is(':visible')) {
            myViz.classAttrsHidden[className] = false;
            $(this).html('hide attributes');
          }
          else {
            myViz.classAttrsHidden[className] = true;
            $(this).html('show attributes');
          }

          myViz.redrawConnectors(); // redraw all arrows!
          return false; // don't reload the page
        });

        // "remember" whether this was hidden earlier during this
        // visualization session
        if (myViz.classAttrsHidden[className]) {
          d3DomElement.find('.classTbl').hide();
          d3DomElement.find('.typeLabel #attrToggleLink').html('show attributes');
        }
      }
    }
    else if (obj[0] == 'FUNCTION') {
      assert(obj.length == 3 || obj.length == 4);

      // pretty-print lambdas and display other weird characters:
      var funcName = htmlspecialchars(obj[1]).replace('&lt;lambda&gt;', '\u03bb');
      var parentFrameID = obj[2]; // optional

      if (!myViz.params.compactFuncLabels) {
        d3DomElement.append('<div class="typeLabel">' + typeLabelPrefix + myViz.getRealLabel('function') + '</div>');
      }

      var funcPrefix = myViz.params.compactFuncLabels ? 'func' : '';

      if (parentFrameID) {
        d3DomElement.append('<div class="funcObj">' + funcPrefix + ' ' + funcName + ' [parent=f'+ parentFrameID + ']</div>');
      }
      else if (myViz.params.showAllFrameLabels) {
        d3DomElement.append('<div class="funcObj">' + funcPrefix + ' ' + funcName + ' [parent=Global]</div>');
      }
      else {
        d3DomElement.append('<div class="funcObj">' + funcPrefix + ' ' + funcName + '</div>');
      }

      // render default argument names/values (see ../pg_encoder.py)
      if (obj.length > 3) {
        var funcProperties = obj[3];
        assert(funcProperties.length > 0);
        d3DomElement.append('<div class="typeLabel" style="margin-top: 3px;">default arguments:</div>');
        d3DomElement.append('<table class="instTbl"></table>');
        var tbl = d3DomElement.children('table');
        $.each(funcProperties, function(ind, kvPair) {
          tbl.append('<tr class="instEntry"><td class="instKey"></td><td class="instVal"></td></tr>');
          var newRow = tbl.find('tr:last');
          var keyTd = newRow.find('td:first');
          var valTd = newRow.find('td:last');
          keyTd.append('<span class="keyObj">' + htmlspecialchars(kvPair[0]) + '</span>');
          myViz.renderNestedObject(kvPair[1], stepNum, valTd);
        });
      }
    }
    else if (obj[0] == 'JS_FUNCTION') { /* TODO: refactor me */
      // JavaScript function
      assert(obj.length == 5);
      var funcName = htmlspecialchars(obj[1]);
      var funcCode = typeLabelPrefix + htmlspecialchars(obj[2]);
      var funcProperties = obj[3]; // either null or a non-empty list of key-value pairs
      var parentFrameID = obj[4];


      if (funcProperties || parentFrameID || myViz.params.showAllFrameLabels) {
        d3DomElement.append('<table class="classTbl"></table>');
        var tbl = d3DomElement.children('table');
        tbl.append('<tr><td class="funcCod" colspan="2"><pre class="funcCode">' + funcCode + '</pre>' + '</td></tr>');

        if (funcProperties) {
          assert(funcProperties.length > 0);
          $.each(funcProperties, function(ind, kvPair) {
              tbl.append('<tr class="classEntry"><td class="classKey"></td><td class="classVal"></td></tr>');
              var newRow = tbl.find('tr:last');
              var keyTd = newRow.find('td:first');
              var valTd = newRow.find('td:last');
              keyTd.append('<span class="keyObj">' + htmlspecialchars(kvPair[0]) + '</span>');
              myViz.renderNestedObject(kvPair[1], stepNum, valTd);
          });
        }

        if (parentFrameID) {
          tbl.append('<tr class="classEntry"><td class="classKey">parent</td><td class="classVal">' + 'f' + parentFrameID + '</td></tr>');
        }
        else if (myViz.params.showAllFrameLabels) {
          tbl.append('<tr class="classEntry"><td class="classKey">parent</td><td class="classVal">' + 'global' + '</td></tr>');
        }
      }
      else {
        // compact form:
        d3DomElement.append('<pre class="funcCode">' + funcCode + '</pre>');
      }
    }
    else if (obj[0] == 'HEAP_PRIMITIVE') {
      assert(obj.length == 3);

      var typeName = obj[1];
      var primitiveVal = obj[2];

      // add a bit of padding to heap primitives, for aesthetics
      d3DomElement.append('<div class="heapPrimitive"></div>');
      d3DomElement.find('div.heapPrimitive').append('<div class="typeLabel">' + typeLabelPrefix + typeName + '</div>');
      myViz.renderPrimitiveObject(primitiveVal, stepNum, d3DomElement.find('div.heapPrimitive'));
    }
    else if (obj[0] == 'C_STRUCT' || obj[0] == 'C_ARRAY' || obj[0] === 'C_MULTIDIMENSIONAL_ARRAY') {
      myViz.renderCStructArray(obj, stepNum, d3DomElement);
    }
    else {
      // render custom data type
      assert(obj.length == 2);

      var typeName = obj[0];
      var strRepr = obj[1];

      strRepr = htmlspecialchars(strRepr); // escape strings!

      d3DomElement.append('<div class="typeLabel">' + typeLabelPrefix + typeName + '</div>');
      d3DomElement.append('<table class="customObjTbl"><tr><td class="customObjElt">' + strRepr + '</td></tr></table>');
    }
  }

  // special-case kludge for C/C++
  renderCStructArray(obj, stepNum, d3DomElement) {
    var myViz = this; // to prevent confusion of 'this' inside of nested functions

    if (obj[0] == 'C_STRUCT') {
      assert(obj.length >= 3);
      var addr = obj[1];
      var typename = obj[2];

      var leader = '';
      if (myViz.params.lang === 'cpp') {
        // call it 'object' instead of 'struct'
        d3DomElement.append('<div class="typeLabel">' + leader + 'object ' + typename + '</div>');
      } else {
        d3DomElement.append('<div class="typeLabel">' + leader + 'struct ' + typename + '</div>');
      }

      if (obj.length > 3) {
        d3DomElement.append('<table class="instTbl"></table>');

        var tbl = d3DomElement.children('table');

        $.each(obj, function(ind, kvPair) {
          if (ind < 3) return; // skip header tags

          tbl.append('<tr class="instEntry"><td class="instKey"></td><td class="instVal"></td></tr>');

          var newRow = tbl.find('tr:last');
          var keyTd = newRow.find('td:first');
          var valTd = newRow.find('td:last');

          // the keys should always be strings, so render them directly (and without quotes):
          // (actually this isn't the case when strings are rendered on the heap)
          assert(typeof kvPair[0] == "string");
          // common case ...
          var attrnameStr = htmlspecialchars(kvPair[0]);
          keyTd.append('<span class="keyObj">' + attrnameStr + '</span>');

          // values can be arbitrary objects, so recurse:
          myViz.renderNestedObject(kvPair[1], stepNum, valTd);
        });
      }
    } else if (obj[0] == 'C_MULTIDIMENSIONAL_ARRAY') {
      // since we can display only 2 dimensions sensibly, make the first
      // dimension into rows and flatten all other dimensions together into
      // columns. in the common case for a 2-D array, this will do the
      // perfect thing: first dimension is rows, second dimension is columns.
      // e.g., for a 4-D array, the first dimension is rows, and dimensions
      // 2, 3, and 4 are flattened together into columns. we can't do
      // any better than this since it doesn't make sense to display
      // more than 2 dimensions at once on screen
      assert(obj.length >= 3);
      var addr = obj[1];
      var dimensions = obj[2];
      assert(dimensions.length > 1); // make sure we're really multidimensional!

      var leader = '';
      d3DomElement.append('<div class="typeLabel">' + leader + 'array</div>');
      d3DomElement.append('<table class="cArrayTbl"></table>');
      var tbl = d3DomElement.children('table');

      // a list of array indices for each dimension
      var indicesByDimension = [];
      for (var d = 0; d < dimensions.length; d++) {
        indicesByDimension.push(d3.range(dimensions[d]));
      }

      // common case is 2-D:
      var allDimensions = multiplyLists(indicesByDimension[0], indicesByDimension[1]);
      // for all dimensions above the second one ...
      for (var d = 2; d < dimensions.length; d++) {
        allDimensions = multiplyLists(allDimensions, indicesByDimension[d]);
      }
      //console.log('allDimensions', JSON.stringify(allDimensions));

      // ignore dimensions[0], which is rows
      var numColumns = 1;
      for (var i=1; i < dimensions.length; i++) {
        numColumns *= dimensions[i];
      }

      for (var row=0; row < dimensions[0]; row++) {
        //console.log('row', row);

        // a pair of rows for header + content, respectively
        tbl.append('<tr></tr>');
        var headerTr = tbl.find('tr:last');
        tbl.append('<tr></tr>');
        var contentTr = tbl.find('tr:last');

        for (var col=0; col < numColumns; col++) {
          var flattenedInd = (row*numColumns) + col; // the real index into the 1-D flattened array stored in obj[3:]
          var realInd = flattenedInd + 3; // skip 3 header fields to get to the real index in obj
          var val = obj[realInd];

          var indToDisplay = allDimensions[flattenedInd].join(',');
          //console.log('  col', col, '| flattenedInd:', flattenedInd, indToDisplay, 'contents:', val);

          // add a new column and then pass in that newly-added column
          // as d3DomElement to the recursive call to child:
          headerTr.append('<td class="cMultidimArrayHeader"></td>');
          headerTr.find('td:last').append(indToDisplay);

          contentTr.append('<td class="cMultidimArrayElt"></td>');
          myViz.renderNestedObject(val, stepNum, contentTr.find('td:last'));
        }
      }
    }
    else {
      assert(obj[0] == 'C_ARRAY');
      assert(obj.length >= 2);
      var addr = obj[1];

      var leader = '';
      d3DomElement.append('<div class="typeLabel">' + leader + 'array</div>');
      d3DomElement.append('<table class="cArrayTbl"></table>');
      var tbl = d3DomElement.children('table');

      tbl.append('<tr></tr><tr></tr>');
      var headerTr = tbl.find('tr:first');
      var contentTr = tbl.find('tr:last');
      $.each(obj, function(ind, val) {
        if (ind < 2) return; // skip 'C_ARRAY' and addr

        // add a new column and then pass in that newly-added column
        // as d3DomElement to the recursive call to child:
        headerTr.append('<td class="cArrayHeader"></td>');
        headerTr.find('td:last').append(ind - 2 /* adjust */);

        contentTr.append('<td class="cArrayElt"></td>');
        myViz.renderNestedObject(val, stepNum, contentTr.find('td:last'));
      });
    }
  }

  redrawConnectors() {
    this.jsPlumbInstance.repaintEverything();
  }

} // END class DataVisualizer

class ProgramOutputBox {
  owner: ExecutionVisualizer;
  domRoot: any;

  // how many *maximum* lines get printed to stdout in the entire trace?
  numStdoutLines: number = 0;

  constructor(owner, domRoot, heightOverride=null) {
    this.owner = owner;
    this.domRoot = domRoot;

    var outputsHTML =
      '<div id="progOutputs">\
         <div id="printOutputDocs">Print output (drag lower right corner to resize)</div>\n\
         <textarea id="pyStdout" cols="40" rows="5" wrap="off" readonly></textarea>\
       </div>';

    this.domRoot.append(outputsHTML);

    // go backwards from the end ... sometimes the final entry doesn't
    // have an stdout
    var lastStdout;
    for (var i = this.owner.curTrace.length-1; i >= 0; i--) {
      lastStdout = this.owner.curTrace[i].stdout;
      if (lastStdout) {
        break;
      }
    }

    if (lastStdout) {
      this.numStdoutLines = lastStdout.rtrim().split('\n').length;
    }

    var stdoutHeight = '75px';
    // heuristic for code with really small outputs
    if (this.numStdoutLines <= 3) {
      stdoutHeight = (25 * this.numStdoutLines) + 'px';
    }
    if (heightOverride) {
      stdoutHeight = heightOverride;
    }
    // do this only after adding outputsHTML to the DOM
    this.domRoot.find('#pyStdout').width('350px')
                                  .height(stdoutHeight)
                                  .resizable();
  }

  renderOutput(stdoutStr: string) {
    if (!stdoutStr) {
      stdoutStr = '';
    }

    // if there isn't anything to display, don't even bother
    // displaying the pane (but this may cause jumpiness later)
    if (this.numStdoutLines > 0) {
      this.domRoot.find('#progOutputs').show();

      var pyStdout = this.domRoot.find("#pyStdout");

      // keep original horizontal scroll level:
      var oldLeft = pyStdout.scrollLeft();
      pyStdout.val((stdoutStr as any).rtrim() /* trim trailing spaces */);
      pyStdout.scrollLeft(oldLeft);
      pyStdout.scrollTop(pyStdout[0].scrollHeight); // scroll to bottom, though
    }
    else {
      this.domRoot.find('#progOutputs').hide();
    }
  }

} // END class ProgramOutputBox

class CodeDisplay {
  owner: ExecutionVisualizer;
  domRoot: any;
  domRootD3: any;

  codToDisplay: string;

  leftGutterSvgInitialized: boolean = false;
  arrowOffsetY: number;
  codeRowHeight: number;

  constructor(owner, domRoot, domRootD3,
              codToDisplay: string, lang: string, editCodeBaseURL: string) {
    this.owner = owner;
    this.domRoot = domRoot;
    this.domRootD3 = domRootD3;
    this.codToDisplay = codToDisplay;

    // 2018-03-15 - removed "Live programming" link from
    // visualization mode to simplify the UI, even if it drives
    // fewer people to live programming mode; they can always click
    // the "Live Programming Mode" button in the code editor:
    //<span id="liveModeSpan" style="display: none;">| <a id="editLiveModeBtn" href="#">Live programming</a></a>\
    //
    // also changed 'Edit code' link to 'Edit this code' to make
    // it more clear to users
    var codeDisplayHTML =
      '<div id="codeDisplayDiv">\
         <div id="langDisplayDiv"></div>\
         <div id="pyCodeOutputDiv"/>\
         <div id="editCodeLinkDiv"><a id="editBtn">Edit this code</a>\
         </div>\
         <div id="legendDiv"/>\
         <div id="codeFooterDocs">Click a line of code to set a breakpoint; use the Back and Forward buttons to jump there.</div>\
       </div>';

    this.domRoot.append(codeDisplayHTML);
    if (this.owner.params.embeddedMode) {
      this.domRoot.find('#editCodeLinkDiv').css('font-size', '10pt');
    }
    this.domRoot.find('#legendDiv')
        .append('<svg id="prevLegendArrowSVG"/> line that has just executed')
        .append('<p style="margin-top: 4px"><svg id="curLegendArrowSVG"/> next line to execute</p>');
    this.domRootD3.select('svg#prevLegendArrowSVG')
        .append('polygon')
        .attr('points', SVG_ARROW_POLYGON)
        .attr('fill', lightArrowColor);
    this.domRootD3.select('svg#curLegendArrowSVG')
        .append('polygon')
        .attr('points', SVG_ARROW_POLYGON)
        .attr('fill', darkArrowColor);

    if (editCodeBaseURL) {
      // kinda kludgy
      var pyVer = '2'; // default
      if (lang === 'js') {
        pyVer = 'js';
      } else if (lang === 'ts') {
        pyVer = 'ts';
      } else if (lang === 'java') {
        pyVer = 'java';
      } else if (lang === 'py3') {
        pyVer = '3';
      } else if (lang === 'py3anaconda') {
        pyVer = 'py3anaconda';
      } else if (lang === 'c') {
        pyVer = 'c';
      } else if (lang === 'cpp') {
        pyVer = 'cpp';
      }

      var urlStr = $.param.fragment(editCodeBaseURL,
                                    {code: this.codToDisplay, py: pyVer},
                                    2);
      this.domRoot.find('#editBtn').attr('href', urlStr);
    }
    else {
      this.domRoot.find('#editCodeLinkDiv').hide(); // just hide for simplicity!
      this.domRoot.find('#editBtn').attr('href', "#");
      this.domRoot.find('#editBtn').click(function(){return false;}); // DISABLE the link!
    }

    if (lang !== undefined) {
      if (lang === 'js') {
        this.domRoot.find('#langDisplayDiv').html('JavaScript');
      } else if (lang === 'ts') {
        this.domRoot.find('#langDisplayDiv').html('TypeScript');
      } else if (lang === 'ruby') {
        this.domRoot.find('#langDisplayDiv').html('Ruby');
      } else if (lang === 'java') {
        this.domRoot.find('#langDisplayDiv').html('Java');
      } else if (lang === 'py2') {
        this.domRoot.find('#langDisplayDiv').html('Python 2.7');
      } else if (lang === 'py3') {
        this.domRoot.find('#langDisplayDiv').html('Python 3.6');
      } else if (lang === 'py3anaconda') {
        this.domRoot.find('#langDisplayDiv').html('Python 3.6 with <a target="_blank" href="https://docs.anaconda.com/anaconda/">Anaconda 5.2</a> <font color="#e93f34">EXPERIMENTAL!</font><br/>(much slower than <a target="_blank" href="visualize.html#py=3">regular Python 3.6</a>, but lets you import more modules)');
      } else if (lang === 'c') {
        if (this.owner.params.embeddedMode) {
          this.domRoot.find('#langDisplayDiv').html('C (gcc 4.8, C11)');
        } else {
          this.domRoot.find('#langDisplayDiv').html('C (gcc 4.8, C11)<br/><font color="#e93f34">EXPERIMENTAL!</font> <a href="https://github.com/pgbovine/OnlinePythonTutor/blob/master/unsupported-features.md" target="_blank">known bugs/limitations</a>');
        }
      } else if (lang === 'cpp') {
        if (this.owner.params.embeddedMode) {
          this.domRoot.find('#langDisplayDiv').html('C++ (gcc 4.8, C++11)');
        } else {
          this.domRoot.find('#langDisplayDiv').html('C++ (gcc 4.8, C++11)<br/><font color="#e93f34">EXPERIMENTAL!</font> <a href="https://github.com/pgbovine/OnlinePythonTutor/blob/master/unsupported-features.md" target="_blank">known bugs/limitations</a>');
        }
      } else {
        this.domRoot.find('#langDisplayDiv').hide();
      }
    }

  }

  renderPyCodeOutput() {
    var myCodOutput = this; // capture
    this.domRoot.find('#pyCodeOutputDiv').empty();

    // maps codeOutputLines down both table columns
    // TODO: get rid of pesky owner dependency
    var codeOutputD3 = this.domRootD3.select('#pyCodeOutputDiv')
      .append('table')
      .attr('id', 'pyCodeOutput')
      .selectAll('tr')
      .data(this.owner.codeOutputLines)
      .enter().append('tr')
      .selectAll('td')
      .data(function(d, i){return [d, d] /* map full data item down both columns */;})
      .enter().append('td')
      .attr('class', function(d, i) {
        // add the togetherjsCloneClick class on here so that we can
        // sync clicks via TogetherJS for setting breakpoints in shared
        // sessions (kinda leaky abstraction since pytutor.ts shouldn't
        // need to know about TogetherJS, but oh wells)
        if (i == 0) {
          return 'lineNo togetherjsCloneClick';
        }
        else {
          return 'cod togetherjsCloneClick';
        }
      })
      .attr('id', (d, i) => {
        if (i == 0) {
          return 'lineNo' + d.lineNumber;
        }
        else {
          return this.owner.generateID('cod' + d.lineNumber); // make globally unique (within the page)
        }
      })
      .html(function(d, i) {
        if (i == 0) {
          return d.lineNumber;
        }
        else {
          return htmlspecialchars(d.text);
        }
      });

    // create a left-most gutter td that spans ALL rows ...
    // (NB: valign="top" is CRUCIAL for this to work in IE)
    this.domRoot.find('#pyCodeOutput tr:first')
        .prepend('<td id="gutterTD" valign="top" rowspan="' + this.owner.codeOutputLines.length + '"><svg id="leftCodeGutterSVG"/></td>');

    // create prevLineArrow and curLineArrow
    this.domRootD3.select('svg#leftCodeGutterSVG')
        .append('polygon')
        .attr('id', 'prevLineArrow')
        .attr('points', SVG_ARROW_POLYGON)
        .attr('fill', lightArrowColor);

    this.domRootD3.select('svg#leftCodeGutterSVG')
        .append('polygon')
        .attr('id', 'curLineArrow')
        .attr('points', SVG_ARROW_POLYGON)
        .attr('fill', darkArrowColor);


    // 2012-09-05: Disable breakpoints for now to simplify UX
    // 2016-05-01: Revive breakpoint functionality
    codeOutputD3
      .style('cursor', function(d, i) {
        // don't do anything if exePts empty (i.e., this line was never executed)
        var exePts = d.executionPoints;
        if (!exePts || exePts.length == 0) {
          return;
        } else {
          return 'pointer'
        }
      })
      .on('click', function(d, i) {
        // don't do anything if exePts empty (i.e., this line was never executed)
        var exePts = d.executionPoints;
        if (!exePts || exePts.length == 0) {
          return;
        }

        d.breakpointHere = !d.breakpointHere; // toggle
        if (d.breakpointHere) {
          myCodOutput.owner.setBreakpoint(d);
          d3.select(this.parentNode).select('td.lineNo').style('color', breakpointColor);
          d3.select(this.parentNode).select('td.lineNo').style('font-weight', 'bold');
          d3.select(this.parentNode).select('td.cod').style('color', breakpointColor);
        }
        else {
          myCodOutput.owner.unsetBreakpoint(d);
          d3.select(this.parentNode).select('td.lineNo').style('color', '');
          d3.select(this.parentNode).select('td.lineNo').style('font-weight', '');
          d3.select(this.parentNode).select('td.cod').style('color', '');
        }
      });
  }

  updateCodOutput(smoothTransition=false) {
    var gutterSVG = this.domRoot.find('svg#leftCodeGutterSVG');

    // one-time initialization of the left gutter
    // (we often can't do this earlier since the entire pane
    //  might be invisible and hence returns a height of zero or NaN
    //  -- the exact format depends on browser)
    if (!this.leftGutterSvgInitialized) {
      // set the gutter's height to match that of its parent
      gutterSVG.height(gutterSVG.parent().height());

      var firstRowOffsetY = this.domRoot.find('table#pyCodeOutput tr:first').offset().top;

      // first take care of edge case when there's only one line ...
      this.codeRowHeight = this.domRoot.find('table#pyCodeOutput td.cod:first').height();

      // ... then handle the (much more common) multi-line case ...
      // this weird contortion is necessary to get the accurate row height on Internet Explorer
      // (simpler methods work on all other major browsers, erghhhhhh!!!)
      if (this.owner.codeOutputLines.length > 1) {
        var secondRowOffsetY = this.domRoot.find('table#pyCodeOutput tr:nth-child(2)').offset().top;
        this.codeRowHeight = secondRowOffsetY - firstRowOffsetY;
      }

      assert(this.codeRowHeight > 0);

      var gutterOffsetY = gutterSVG.offset().top;
      var teenyAdjustment = gutterOffsetY - firstRowOffsetY;

      // super-picky detail to adjust the vertical alignment of arrows so that they line up
      // well with the pointed-to code text ...
      // (if you want to manually adjust tableTop, then ~5 is a reasonable number)
      this.arrowOffsetY = Math.floor((this.codeRowHeight / 2) - (SVG_ARROW_HEIGHT / 2)) - teenyAdjustment;

      this.leftGutterSvgInitialized = true;
    }

    assert(this.arrowOffsetY !== undefined);
    assert(this.codeRowHeight !== undefined);
    assert(0 <= this.arrowOffsetY && this.arrowOffsetY <= this.codeRowHeight);

    // assumes that this.owner.updateLineAndExceptionInfo has already
    // been run, so line number info is up-to-date!

    // TODO: get rid of this pesky 'owner' dependency
    var myViz = this.owner;
    var isLastInstr = (myViz.curInstr === (myViz.curTrace.length-1));
    var curEntry = myViz.curTrace[myViz.curInstr];
    var hasError = (curEntry.event === 'exception' || curEntry.event === 'uncaught_exception');
    var isTerminated = (!myViz.instrLimitReached && isLastInstr);
    var pcod = this.domRoot.find('#pyCodeOutputDiv');

    var prevVerticalNudge = myViz.prevLineIsReturn ? Math.floor(this.codeRowHeight / 3) : 0;
    var curVerticalNudge  = myViz.curLineIsReturn  ? Math.floor(this.codeRowHeight / 3) : 0;

    // ugly edge case for the final instruction :0
    if (isTerminated && !hasError) {
      if (myViz.prevLineNumber !== myViz.curLineNumber) {
        curVerticalNudge = curVerticalNudge - 2;
      }
    }

    if (myViz.prevLineNumber) {
      var pla = this.domRootD3.select('#prevLineArrow');
      var translatePrevCmd = 'translate(0, ' + (((myViz.prevLineNumber - 1) * this.codeRowHeight) + this.arrowOffsetY + prevVerticalNudge) + ')';
      if (smoothTransition) {
        pla
          .transition()
          .duration(200)
          .attr('fill', 'white')
          .each('end', function() {
                pla
                  .attr('transform', translatePrevCmd)
                  .attr('fill', lightArrowColor);
                gutterSVG.find('#prevLineArrow').show(); // show at the end to avoid flickering
            });
      }
      else {
        pla.attr('transform', translatePrevCmd)
        gutterSVG.find('#prevLineArrow').show();
      }
    } else {
      gutterSVG.find('#prevLineArrow').hide();
    }

    if (myViz.curLineNumber) {
      var cla = this.domRootD3.select('#curLineArrow');
      var translateCurCmd = 'translate(0, ' + (((myViz.curLineNumber - 1) * this.codeRowHeight) + this.arrowOffsetY + curVerticalNudge) + ')';
      if (smoothTransition) {
        cla
          .transition()
          .delay(200)
          .duration(250)
          .attr('transform', translateCurCmd);
      } else {
        cla.attr('transform', translateCurCmd);
      }
      gutterSVG.find('#curLineArrow').show();
    }
    else {
      gutterSVG.find('#curLineArrow').hide();
    }

    this.domRootD3.selectAll('#pyCodeOutputDiv td.cod')
      .style('border-top', function(d) {
        if (hasError && (d.lineNumber == curEntry.line)) {
          return '1px solid ' + errorColor;
        }
        else {
          return '';
        }
      })
      .style('border-bottom', function(d) {
        // COPY AND PASTE ALERT!
        if (hasError && (d.lineNumber == curEntry.line)) {
          return '1px solid ' + errorColor;
        }
        else {
          return '';
        }
      });

    // returns True iff lineNo is visible in pyCodeOutputDiv
    var isOutputLineVisible = (lineNo) => {
      var lineNoTd = this.domRoot.find('#lineNo' + lineNo);
      // if we can't even find this lineNo div, then punt!
      if (!lineNoTd || lineNoTd.length /* jQuery selector returns a list */ === 0) {
        return false;
      }
      var LO = lineNoTd.offset().top;

      var PO = pcod.offset().top;
      var ST = pcod.scrollTop();
      var H = pcod.height();

      // add a few pixels of fudge factor on the bottom end due to bottom scrollbar
      return (PO <= LO) && (LO < (PO + H - 30));
    }

    // smoothly scroll pyCodeOutputDiv so that the given line is at the center
    var scrollCodeOutputToLine = (lineNo) => {
      var lineNoTd = this.domRoot.find('#lineNo' + lineNo);
      // if we can't even find this lineNo div, then punt!
      if (!lineNoTd || lineNoTd.length /* jQuery selector returns a list */ === 0) {
        return false;
      }
      var LO = lineNoTd.offset().top;

      var PO = pcod.offset().top;
      var ST = pcod.scrollTop();
      var H = pcod.height();

      pcod.stop(); // first stop all previously-queued animations
      pcod.animate({scrollTop: (ST + (LO - PO - (Math.round(H / 2))))}, 300);
    }

    // smoothly scroll code display
    if (!isOutputLineVisible(curEntry.line)) {
      scrollCodeOutputToLine(curEntry.line);
    }
  }

} // END class CodeDisplay

class NavigationController {
  owner: ExecutionVisualizer;
  domRoot: any;
  domRootD3: any;
  nSteps: number;

  constructor(owner, domRoot, domRootD3, nSteps) {
    this.owner = owner;
    this.domRoot = domRoot;
    this.domRootD3 = domRootD3;
    this.nSteps = nSteps;

    var navHTML = '<div id="navControlsDiv">\
                     <div id="executionSlider"/>\
                     <div id="executionSliderFooter"/>\
                     <div id="vcrControls">\
                       <button id="jmpFirstInstr", type="button">&lt;&lt; First</button>\
                       <button id="jmpStepBack", type="button">&lt; Back</button>\
                       <span id="curInstr">Step ? of ?</span>\
                       <button id="jmpStepFwd", type="button">Forward &gt;</button>\
                       <button id="jmpLastInstr", type="button">Last &gt;&gt;</button>\
                     </div>\
                     <div id="rawUserInputDiv">\
                       <span id="userInputPromptStr"/>\
                       <input type="text" id="raw_input_textbox" size="30"/>\
                       <button id="raw_input_submit_btn">Submit</button>\
                     </div>\
                     <div id="errorOutput"/>\
                   </div>';

    this.domRoot.append(navHTML);

    this.domRoot.find("#jmpFirstInstr").click(() => {this.owner.renderStep(0);});
    this.domRoot.find("#jmpLastInstr").click(() => {this.owner.renderStep(this.nSteps - 1);});
    this.domRoot.find("#jmpStepBack").click(() => {this.owner.stepBack();});
    this.domRoot.find("#jmpStepFwd").click(() => {this.owner.stepForward();});

    // disable controls initially ...
    this.domRoot.find("#vcrControls #jmpFirstInstr").attr("disabled", true);
    this.domRoot.find("#vcrControls #jmpStepBack").attr("disabled", true);
    this.domRoot.find("#vcrControls #jmpStepFwd").attr("disabled", true);
    this.domRoot.find("#vcrControls #jmpLastInstr").attr("disabled", true);

    var ruiDiv = this.domRoot.find('#rawUserInputDiv');
    ruiDiv.find('#userInputPromptStr').html(this.owner.userInputPromptStr);
    ruiDiv.find('#raw_input_submit_btn').click(() => {
      var userInput = ruiDiv.find('#raw_input_textbox').val();
      // advance instruction count by 1 to get to the NEXT instruction
      this.owner.params.executeCodeWithRawInputFunc(userInput, this.owner.curInstr + 1);
    });
  }

  hideUserInputDiv() {
    this.domRoot.find('#rawUserInputDiv').hide();
  }

  showUserInputDiv() {
    this.domRoot.find('#rawUserInputDiv').show();
  }

  setSliderVal(v: number) {
    // PROGRAMMATICALLY change the value, so evt.originalEvent should be undefined
    this.domRoot.find('#executionSlider').slider('value', v);
  }

  setVcrControls(msg: string, isFirstInstr: boolean, isLastInstr: boolean) {
    var vcrControls = this.domRoot.find("#vcrControls");
    vcrControls.find("#curInstr").html(msg);
    vcrControls.find("#jmpFirstInstr").attr("disabled", false);
    vcrControls.find("#jmpStepBack").attr("disabled", false);
    vcrControls.find("#jmpStepFwd").attr("disabled", false);
    vcrControls.find("#jmpLastInstr").attr("disabled", false);

    if (isFirstInstr) {
      vcrControls.find("#jmpFirstInstr").attr("disabled", true);
      vcrControls.find("#jmpStepBack").attr("disabled", true);
    }
    if (isLastInstr) {
      vcrControls.find("#jmpLastInstr").attr("disabled", true);
      vcrControls.find("#jmpStepFwd").attr("disabled", true);
    }
  }

  setupSlider(maxSliderVal: number) {
    assert(maxSliderVal >= 0);
    var sliderDiv = this.domRoot.find('#executionSlider');
    sliderDiv.slider({min: 0, max: maxSliderVal, step: 1});
    // disable keyboard actions on the slider itself (to prevent double-firing
    // of events), and make skinnier and taller
    sliderDiv
      .find(".ui-slider-handle")
      .unbind('keydown')
      .css('width', '0.8em')
      .css('height', '1.4em');

    this.domRoot.find(".ui-widget-content").css('font-size', '0.9em');
    this.domRoot.find('#executionSlider').bind('slide', (evt, ui) => {
      // this is SUPER subtle. if this value was changed programmatically,
      // then evt.originalEvent will be undefined. however, if this value
      // was changed by a user-initiated event, then this code should be
      // executed ...
      if (evt.originalEvent) {
        this.owner.renderStep(ui.value);
      }
    });
  }

  renderSliderBreakpoints(sortedBreakpointsList) {
    this.domRoot.find("#executionSliderFooter").empty();
    var w = this.domRoot.find('#executionSlider').width();

    // I originally didn't want to delete and re-create this overlay every time,
    // but if I don't do so, there are weird flickering artifacts with clearing
    // the SVG container; so it's best to just delete and re-create the container each time
    var sliderOverlay = this.domRootD3.select('#executionSliderFooter')
      .append('svg')
      .attr('id', 'sliderOverlay')
      .attr('width', w)
      .attr('height', 12);

    var xrange = d3.scale.linear()
      .domain([0, this.nSteps - 1])
      .range([0, w]);

    sliderOverlay.selectAll('rect')
      .data(sortedBreakpointsList)
      .enter().append('rect')
      .attr('x', function(d, i) {
        // make edge case of 0 look decent:
        return (d === 0) ? 0 : xrange(d) - 1;
      })
      .attr('y', 0)
      .attr('width', 2)
      .attr('height', 12)
      .style('fill', function(d) {
         return breakpointColor;
      });
  }

  showError(msg: string) {
    if (msg) {
      this.domRoot.find("#errorOutput").html(htmlspecialchars(msg) + `
      <span style="font-size: 9pt; color: #666">(see <a href="https://github.com/pgbovine/OnlinePythonTutor/blob/master/unsupported-features.md" target="_blank">unsupported features</a>)</span>`).show();
    } else {
      this.domRoot.find("#errorOutput").hide();
    }
  }

} // END class NavigationController


// Utilities

export function assert(cond) {
  if (!cond) {
    console.trace();
    alert("Assertion Failure (see console log for backtrace)");
    throw 'Assertion Failure';
  }
}

// taken from http://www.toao.net/32-my-htmlspecialchars-function-for-javascript
export function htmlspecialchars(str) {
  if (typeof(str) == "string") {
    str = str.replace(/&/g, "&amp;"); /* must do &amp; first */

    // ignore these for now ...
    //str = str.replace(/"/g, "&quot;");
    //str = str.replace(/'/g, "&#039;");

    str = str.replace(/</g, "&lt;");
    str = str.replace(/>/g, "&gt;");

    // replace spaces:
    str = str.replace(/ /g, "&nbsp;");

    // replace tab as four spaces:
    str = str.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");

    // replace newline as <br/>
    str = str.replace(newlineAllRegex, '<br/>');
  }
  return str;
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


(String.prototype as any /* TS too strict */).rtrim = function() {
  return this.replace(/\s*$/g, "");
}


// make sure varname doesn't contain any weird
// characters that are illegal for CSS ID's ...
//
// I know for a fact that iterator tmp variables named '_[1]'
// are NOT legal names for CSS ID's.
// I also threw in '{', '}', '(', ')', '<', '>' as illegal characters.
//
// also some variable names are like '.0' (for generator expressions),
// and '.' seems to be illegal.
//
// also '=', '!', and '?' are common in Ruby names, so escape those as well
// '$' sometimes found in JavaScript names, so escape as well
//
// also spaces are illegal, so convert to '_'
// TODO: what other characters are illegal???
var lbRE = new RegExp('\\[|{|\\(|<', 'g');
var rbRE = new RegExp('\\]|}|\\)|>', 'g');
function varnameToCssID(varname) {
  // make sure to REPLACE ALL (using the 'g' option)
  // rather than just replacing the first entry
  return varname.replace(lbRE, 'LeftB_')
                .replace(rbRE, '_RightB')
                .replace(/[!]/g, '_BANG_')
                .replace(/[?]/g, '_QUES_')
                .replace(/[:]/g, '_COLON_')
                .replace(/[=]/g, '_EQ_')
                .replace(/[.]/g, '_DOT_')
                .replace(/[$]/g, '_DOLLAR_')
                .replace(/ /g, '_');
}

function isHeapRef(obj, heap) {
  // ordinary REF
  if (obj[0] === 'REF') {
    return (heap[obj[1]] !== undefined);
  } else if (obj[0] === 'C_DATA' && obj[2] === 'pointer') {
    // C-style pointer that has a valid value
    if (obj[3] != '<UNINITIALIZED>' && obj[3] != '<UNALLOCATED>') {
      return (heap[obj[3]] !== undefined);
    }
  }

  return false;
}

function getRefID(obj) {
  if (obj[0] == 'REF') {
    return obj[1];
  } else {
    assert (obj[0] === 'C_DATA' && obj[2] === 'pointer');
    assert (obj[3] != '<UNINITIALIZED>' && obj[3] != '<UNALLOCATED>');
    return obj[3]; // pointed-to address
  }
}
