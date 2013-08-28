/*

Online Python Tutor
https://github.com/pgbovine/OnlinePythonTutor/

Copyright (C) 2010-2013 Philip J. Guo (philip@pgbovine.net)

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


// Pre-reqs: pytutor.js and jquery.ba-bbq.min.js should be imported BEFORE this file


var myVisualizer = null; // singleton ExecutionVisualizer instance


$(document).ready(function() {
  var preseededCode = $.bbq.getState('code');

  var pyState = $.bbq.getState('py');
  var verticalStackBool = ($.bbq.getState('verticalStack') == 'true'); // boolean
  var heapPrimitivesBool = ($.bbq.getState('heapPrimitives') == 'true');
  var drawParentPointerBool = ($.bbq.getState('drawParentPointers') == 'true');
  var textRefsBool = ($.bbq.getState('textReferences') == 'true');
  var showOnlyOutputsBool = ($.bbq.getState('showOnlyOutputs') == 'true');

  // set up all options in a JS object
  var options = {cumulative_mode: ($.bbq.getState('cumulative') == 'true'),
                 heap_primitives: heapPrimitivesBool,
                 show_only_outputs: showOnlyOutputsBool,
                 py_crazy_mode: ($.bbq.getState('py') == '2crazy')};


  var preseededCurInstr = Number($.bbq.getState('curInstr'));
  if (!preseededCurInstr) {
    preseededCurInstr = 0;
  }

  /*
  $.get(backend_script,
        {user_script : preseededCode,
         options_json: JSON.stringify(options)},
        function(dataFromBackend) {
          var trace = dataFromBackend.trace;

          // don't enter visualize mode if there are killer errors:
          if (!trace ||
              (trace.length == 0) ||
              (trace[trace.length - 1].event == 'uncaught_exception')) {

            if (trace.length == 1) {
              alert(trace[0].exception_msg);
            }
            else if (trace[trace.length - 1].exception_msg) {
              alert(trace[trace.length - 1].exception_msg);
            }
            else {
              alert("Whoa, unknown error! Reload to try again, or report a bug to philip@pgbovine.net\n\n(Click the 'Generate URL' button to include a unique URL in your email bug report.)");
            }
          }
          else {
            var startingInstruction = 0;

            // only do this at most ONCE, and then clear out preseededCurInstr
            if (preseededCurInstr && preseededCurInstr < trace.length) { // NOP anyways if preseededCurInstr is 0
              startingInstruction = preseededCurInstr;
            }

            myVisualizer = new ExecutionVisualizer('vizDiv',
                                                   dataFromBackend,
                                                   {startingInstruction: preseededCurInstr,
                                                    embeddedMode: true,
                                                    verticalStack: verticalStackBool,
                                                    disableHeapNesting: heapPrimitivesBool,
                                                    drawParentPointers: drawParentPointerBool,
                                                    textualMemoryLabels: textRefsBool,
                                                    showOnlyOutputs: showOnlyOutputsBool,
                                                    highlightLines: typeof $.bbq.getState("highlightLines") !== "undefined",
                                                    pyCrazyMode: ($.bbq.getState('py') == '2crazy'),
                                                    updateOutputCallback: (resizeContainer ? resizeContainerNow : null)
                                                   });

            // set keyboard bindings
            // VERY IMPORTANT to clear and reset this every time or
            // else the handlers might be bound multiple times
            $(document).unbind('keydown');
            $(document).keydown(function(k) {
              if (k.keyCode == 37) { // left arrow
                if (myVisualizer.stepBack()) {
                  k.preventDefault(); // don't horizontally scroll the display
                }
              }
              else if (k.keyCode == 39) { // right arrow
                if (myVisualizer.stepForward()) {
                  k.preventDefault(); // don't horizontally scroll the display
                }
              }
            });
          }
        },
        "json");
  */

  // log a generic AJAX error handler
  $(document).ajaxError(function() {
    alert("Online Python Tutor server error (possibly due to memory/resource overload).");
  });


  // redraw connector arrows on window resize
  $(window).resize(function() {
    if (typeof appMode !== "undefined" && appMode == 'display') {
      myVisualizer.redrawConnectors();
    }
  });

  updater.start();
});


// Adapted from https://github.com/facebook/tornado/tree/master/demos/websocket

// Copyright 2009 FriendFeed
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may
// not use this file except in compliance with the License. You may obtain
// a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

var updater = {
    socket: null,
    start: function() {
      var url = "ws://" + location.host + "/chatsocket";
      updater.socket = new WebSocket(url);
      updater.socket.onmessage = function(event) {
        updater.showMessage(JSON.parse(event.data));
      }
    },

    showMessage: function(message) {
      myVisualizer = new ExecutionVisualizer('vizDiv',
                                             message,
                                             {startingInstruction: message.trace.length - 1,
                                              embeddedMode: true,
                                             });

      // set keyboard bindings
      // VERY IMPORTANT to clear and reset this every time or
      // else the handlers might be bound multiple times
      $(document).unbind('keydown');
      $(document).keydown(function(k) {
        if (k.keyCode == 37) { // left arrow
          if (myVisualizer.stepBack()) {
            k.preventDefault(); // don't horizontally scroll the display
          }
        }
        else if (k.keyCode == 39) { // right arrow
          if (myVisualizer.stepForward()) {
            k.preventDefault(); // don't horizontally scroll the display
          }
        }
      });
    }

};
