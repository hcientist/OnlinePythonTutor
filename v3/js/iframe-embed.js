/*

Online Python Tutor
https://github.com/pgbovine/OnlinePythonTutor/

Copyright (C) Philip J. Guo (philip@pgbovine.net)

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


// Pre-reqs:
// - pytutor.js
// - jquery.ba-bbq.min.js
// - jquery.ba-dotimeout.min.js // for event debouncing: http://benalman.com/code/projects/jquery-dotimeout/examples/debouncing/
// - opt-frontend-common.js
// should all be imported BEFORE this file

var originFrontendJsFile = 'iframe-embed.js';

function NOP() {};

function iframeHandleUncaughtException(trace) {
  var excMsg = null;
  if (trace.length == 1) {
    excMsg = trace[0].exception_msg; // killer!
  }
  else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
    excMsg = trace[trace.length - 1].exception_msg;
  }
  else {
    excMsg = "Unknown error. Reload the page and try again. Or report a bug to philip@pgbovine.net";
  }
  $("#vizDiv").html(htmlspecialchars(excMsg));
}



$(document).ready(function() {
  var queryStrOptions = getQueryStringOptions();

  var preseededCode = queryStrOptions.preseededCode;
  var pyState = queryStrOptions.py;
  var verticalStackBool = (queryStrOptions.verticalStack == 'true');
  var heapPrimitivesBool = (queryStrOptions.heapPrimitives == 'true');
  var textRefsBool = (queryStrOptions.textReferences == 'true');
  var cumModeBool = (queryStrOptions.cumulative == 'true');

  // these two are deprecated
  var drawParentPointerBool = (queryStrOptions.drawParentPointers == 'true');
  var showOnlyOutputsBool = (queryStrOptions.showOnlyOutputs == 'true');

  var codeDivWidth = undefined;
  var cdw = $.bbq.getState('codeDivWidth');
  if (cdw) {
    codeDivWidth = Number(cdw);
  }

  var codeDivHeight = undefined;
  var cdh = $.bbq.getState('codeDivHeight');
  if (cdh) {
    codeDivHeight = Number(cdh);
  }


  var startingInstruction = queryStrOptions.preseededCurInstr;
  if (!startingInstruction) {
    startingInstruction = 0;
  }

  var backend_script = langToBackendScript(pyState);
  assert(backend_script);

  // David Pritchard's code for resizeContainer option ...
  var resizeContainer = ($.bbq.getState('resizeContainer') == 'true');
    
  if (resizeContainer) {
      function findContainer() {
          var ifs = window.top.document.getElementsByTagName("iframe");
          for(var i = 0, len = ifs.length; i < len; i++)  {
              var f = ifs[i];
              var fDoc = f.contentDocument || f.contentWindow.document;
              if(fDoc === document)   {
                  return f;
              }
          }
      }
      
      var container = findContainer();
      
      function resizeContainerNow() {
          $(container).height($("html").height());
      };
  }


  // set up all options in a JS object
  var backendOptionsObj = {cumulative_mode: cumModeBool,
                           heap_primitives: heapPrimitivesBool,
                           show_only_outputs: showOnlyOutputsBool,
                           py_crazy_mode: (pyState == '2crazy'),
                           origin: originFrontendJsFile};

  var frontendOptionsObj = {startingInstruction: startingInstruction,
                            embeddedMode: true,
                            verticalStack: verticalStackBool,
                            disableHeapNesting: heapPrimitivesBool,
                            drawParentPointers: drawParentPointerBool,
                            textualMemoryLabels: textRefsBool,
                            showOnlyOutputs: showOnlyOutputsBool,
                            executeCodeWithRawInputFunc: executeCodeWithRawInput,
                            heightChangeCallback: (resizeContainer ? resizeContainerNow : NOP),

                            // undocumented experimental modes:
                            pyCrazyMode: (pyState == '2crazy'),
                            highlightLines: typeof $.bbq.getState("highlightLines") !== "undefined",
                            codeDivWidth: codeDivWidth,
                            codeDivHeight: codeDivHeight,
                           }

  function executeCode(forceStartingInstr) {
    if (forceStartingInstr) {
      frontendOptionsObj.startingInstruction = forceStartingInstr;
    }
    executeCodeAndCreateViz(preseededCode,
                            backend_script, backendOptionsObj,
                            frontendOptionsObj,
                            'vizDiv',
                            function() { // success
                              if (resizeContainer)
                                  resizeContainerNow();
                              myVisualizer.redrawConnectors();
                            },
                            iframeHandleUncaughtException);
  }


  function executeCodeFromScratch() {
    // reset these globals
    rawInputLst = [];
    executeCode();
  }

  function executeCodeWithRawInput(rawInputStr, curInstr) {
    // set some globals
    rawInputLst.push(rawInputStr);
    executeCode(curInstr);
  }


  // log a generic AJAX error handler
  $(document).ajaxError(function() {
    alert("Ugh, Online Python Tutor server error :( Email philip@pgbovine.net");
  });


  // redraw connector arrows on window resize
  $(window).resize(function() {
    myVisualizer.redrawConnectors();
  });


  executeCodeFromScratch(); // finally, execute code and display visualization
});
