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


// Front-end for OPT + IPython shell integration


// Pre-reqs: pytutor.js and jquery.ba-bbq.min.js should be imported BEFORE this file


var myVisualizer = null; // singleton ExecutionVisualizer instance


$(document).ready(function() {
  // redraw connector arrows on window resize
  $(window).resize(function() {
    myVisualizer.redrawConnectors();
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
      if (message.type == 'wholetrace') {
          payload = message.payload

          var curInstr = 0;
          var jumpToEnd = true; // yes by default

          // if the user isn't currently viewing the final element of
          // the trace, then restore their original position, so that
          // their display doesn't suddenly jump to the end
          if (myVisualizer) {
            curInstr = myVisualizer.curInstr;
            jumpToEnd = (curInstr == myVisualizer.curTrace.length - 1);
          }

          if (jumpToEnd) {
            myVisualizer = new ExecutionVisualizer('vizDiv',
                                                   payload,
                                                   {embeddedMode: true,
                                                    jumpToEnd: true});
          }
          else {
            myVisualizer = new ExecutionVisualizer('vizDiv',
                                                   payload,
                                                   {embeddedMode: true,
                                                    startingInstruction: curInstr});
          }

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
        else if (message.type == 'difftrace') {
            // TODO: implement optimization based on, say,
            // https://code.google.com/p/google-diff-match-patch/

            // for starters, simply create a new ExecutionVisualizer
            // object using the patched version of the payload
        }
        else if (message.type == 'clear') {
          myVisualizer = null;
          $('#vizDiv').empty();
          $(document).unbind('keydown');
          return;
        }
    }
};
