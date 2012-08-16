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


// Pre-reqs: pytutor.js and jquery.ba-bbq.min.js should be imported BEFORE this file

var backend_script = 'exec'; // URL of backend script, which must eventually call pg_logger.py

var appMode = 'edit'; // 'edit' or 'visualize'

var preseededCode = null;     // if you passed in a 'code=<code string>' in the URL, then set this var
var preseededCurInstr = null; // if you passed in a 'curInstr=<number>' in the URL, then set this var


var myVisualizer = null; // singleton ExecutionVisualizer instance

function enterEditMode() {
  $.bbq.pushState({ mode: 'edit' }, 2 /* completely override other hash strings to keep URL clean */);
}


var pyInputCodeMirror; // CodeMirror object that contains the input text

function setCodeMirrorVal(dat) {
  pyInputCodeMirror.setValue(dat.rtrim() /* kill trailing spaces */);
}


$(document).ready(function() {

  pyInputCodeMirror = CodeMirror(document.getElementById('codeInputPane'), {
    mode: 'python',
    lineNumbers: true,
    tabSize: 2
  });

  pyInputCodeMirror.setSize(null, '450px');



  // be friendly to the browser's forward and back buttons
  // thanks to http://benalman.com/projects/jquery-bbq-plugin/
  $(window).bind("hashchange", function(e) {
    appMode = $.bbq.getState('mode'); // assign this to the GLOBAL appMode

    preseededCode = $.bbq.getState('code'); // yuck, global!
    var preseededMode = $.bbq.getState('mode');

    if ($.bbq.getState('cumulative_mode') == 'true') {
      $('#cumulativeMode').prop('checked', true);
    }

    // only bother with curInstr when we're visualizing ...
    if (!preseededCurInstr && preseededMode == 'visualize') { // TODO: kinda gross hack
      preseededCurInstr = Number($.bbq.getState('curInstr'));
    }

    // default mode is 'edit'
    if (appMode == undefined) {
      appMode = 'edit';
    }

    // if there's no myVisualizer, then default to edit mode since there's
    // nothing to visualize:
    if (!myVisualizer) {
      appMode = 'edit';

      if (preseededCode && preseededMode == 'visualize') {
        // punt for now ...
      }
      else {
        $.bbq.pushState({ mode: 'edit' }, 2 /* completely override other hash strings to keep URL clean */);
      }
    }


    if (appMode == 'edit') {
      $("#pyInputPane").show();
      $("#pyOutputPane").hide();
    }
    else if (appMode == 'visualize') {
      $("#pyInputPane").hide();
      $("#pyOutputPane").show();

      $('#executeBtn').html("Visualize execution");
      $('#executeBtn').attr('disabled', false);


      // do this AFTER making #pyOutputPane visible, or else
      // jsPlumb connectors won't render properly
      myVisualizer.updateOutput();

      // grab focus so that keyboard events work
      myVisualizer.grabKeyboardFocus();

      // customize edit button click functionality AFTER rendering (TODO: awkward!)
      $('#pyOutputPane #editBtn').click(function() {
        enterEditMode();
      });

    }
    else {
      assert(false);
    }
  });

  // From: http://benalman.com/projects/jquery-bbq-plugin/
  //   Since the event is only triggered when the hash changes, we need
  //   to trigger the event now, to handle the hash the page may have
  //   loaded with.
  $(window).trigger( "hashchange" );


  $("#executeBtn").attr('disabled', false);
  $("#executeBtn").click(function() {
    $('#executeBtn').html("Please wait ... processing your code");
    $('#executeBtn').attr('disabled', true);
    $("#pyOutputPane").hide();


    $.get(backend_script,
          {user_script : pyInputCodeMirror.getValue(),
           cumulative_mode: $('#cumulativeMode').prop('checked')},
          function(dataFromBackend) {
            var trace = dataFromBackend.trace;
            
            // don't enter visualize mode if there are killer errors:
            if (!trace ||
                (trace.length == 0) ||
                (trace[trace.length - 1].event == 'uncaught_exception')) {

              if (trace.length == 1) {
                var errorLineNo = trace[0].line - 1; /* CodeMirror lines are zero-indexed */
                if (errorLineNo !== undefined) {
                  // highlight the faulting line in pyInputCodeMirror
                  pyInputCodeMirror.focus();
                  pyInputCodeMirror.setCursor(errorLineNo, 0);
                  pyInputCodeMirror.setLineClass(errorLineNo, null, 'errorLine');

                  pyInputCodeMirror.setOption('onChange', function() {
                    pyInputCodeMirror.setLineClass(errorLineNo, null, null); // reset line back to normal
                    pyInputCodeMirror.setOption('onChange', null); // cancel
                  });
                }

                alert(trace[0].exception_msg);
              }
              else {
                alert("Whoa, unknown error! Reload to try again, or report a bug to philip@pgbovine.net\n\n(Click the 'Generate URL' button to include a unique URL in your email bug report.)");
              }

              $('#executeBtn').html("Visualize execution");
              $('#executeBtn').attr('disabled', false);
            }
            else {
              var startingInstruction = 0;

              // only do this at most ONCE, and then clear out preseededCurInstr
              if (preseededCurInstr && preseededCurInstr < trace.length) { // NOP anyways if preseededCurInstr is 0
                startingInstruction = preseededCurInstr;
                preseededCurInstr = null;
              }

              myVisualizer = new ExecutionVisualizer('pyOutputPane',
                                                     dataFromBackend,
                                                     {startingInstruction: startingInstruction});

              $.bbq.pushState({ mode: 'visualize' }, 2 /* completely override other hash strings to keep URL clean */);
            }
          },
          "json");
  });



  // canned examples

  $("#tutorialExampleLink").click(function() {
    $.get("example-code/py_tutorial.txt", setCodeMirrorVal);
    return false;
  });

  $("#strtokExampleLink").click(function() {
    $.get("example-code/strtok.txt", setCodeMirrorVal);
    return false;
  });

  $("#fibonacciExampleLink").click(function() {
    $.get("example-code/fib.txt", setCodeMirrorVal);
    return false;
  });

  $("#memoFibExampleLink").click(function() {
    $.get("example-code/memo_fib.txt", setCodeMirrorVal);
    return false;
  });

  $("#factExampleLink").click(function() {
    $.get("example-code/fact.txt", setCodeMirrorVal);
    return false;
  });

  $("#filterExampleLink").click(function() {
    $.get("example-code/filter.txt", setCodeMirrorVal);
    return false;
  });

  $("#insSortExampleLink").click(function() {
    $.get("example-code/ins_sort.txt", setCodeMirrorVal);
    return false;
  });

  $("#aliasExampleLink").click(function() {
    $.get("example-code/aliasing.txt", setCodeMirrorVal);
    return false;
  });

  $("#newtonExampleLink").click(function() {
    $.get("example-code/sqrt.txt", setCodeMirrorVal);
    return false;
  });

  $("#oopSmallExampleLink").click(function() {
    $.get("example-code/oop_small.txt", setCodeMirrorVal);
    return false;
  });

  $("#mapExampleLink").click(function() {
    $.get("example-code/map.txt", setCodeMirrorVal);
    return false;
  });

  $("#oop1ExampleLink").click(function() {
    $.get("example-code/oop_1.txt", setCodeMirrorVal);
    return false;
  });

  $("#oop2ExampleLink").click(function() {
    $.get("example-code/oop_2.txt", setCodeMirrorVal);
    return false;
  });

  $("#inheritanceExampleLink").click(function() {
    $.get("example-code/oop_inherit.txt", setCodeMirrorVal);
    return false;
  });

  $("#sumExampleLink").click(function() {
    $.get("example-code/sum.txt", setCodeMirrorVal);
    return false;
  });

  $("#pwGcdLink").click(function() {
    $.get("example-code/wentworth_gcd.txt", setCodeMirrorVal);
    return false;
  });

  $("#pwSumListLink").click(function() {
    $.get("example-code/wentworth_sumList.txt", setCodeMirrorVal);
    return false;
  });

  $("#towersOfHanoiLink").click(function() {
    $.get("example-code/towers_of_hanoi.txt", setCodeMirrorVal);
    return false;
  });

  $("#pwTryFinallyLink").click(function() {
    $.get("example-code/wentworth_try_finally.txt", setCodeMirrorVal);
    return false;
  });


  $('#closure1Link').click(function() {
    $.get("example-code/closures/closure1.txt", setCodeMirrorVal);
    return false;
  });
  $('#closure2Link').click(function() {
    $.get("example-code/closures/closure2.txt", setCodeMirrorVal);
    return false;
  });
  $('#closure3Link').click(function() {
    $.get("example-code/closures/closure3.txt", setCodeMirrorVal);
    return false;
  });
  $('#closure4Link').click(function() {
    $.get("example-code/closures/closure4.txt", setCodeMirrorVal);
    return false;
  });
  $('#closure5Link').click(function() {
    $.get("example-code/closures/closure5.txt", setCodeMirrorVal);
    return false;
  });


  $('#aliasing1Link').click(function() {
    $.get("example-code/aliasing/aliasing1.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing2Link').click(function() {
    $.get("example-code/aliasing/aliasing2.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing3Link').click(function() {
    $.get("example-code/aliasing/aliasing3.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing4Link').click(function() {
    $.get("example-code/aliasing/aliasing4.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing5Link').click(function() {
    $.get("example-code/aliasing/aliasing5.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing6Link').click(function() {
    $.get("example-code/aliasing/aliasing6.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing7Link').click(function() {
    $.get("example-code/aliasing/aliasing7.txt", setCodeMirrorVal);
    return false;
  });
  $('#aliasing8Link').click(function() {
    $.get("example-code/aliasing/aliasing8.txt", setCodeMirrorVal);
    return false;
  });


  $('#ll1Link').click(function() {
    $.get("example-code/linked-lists/ll1.txt", setCodeMirrorVal);
    return false;
  });
  $('#ll2Link').click(function() {
    $.get("example-code/linked-lists/ll2.txt", setCodeMirrorVal);
    return false;
  });


  if (preseededCode) {
    setCodeMirrorVal(preseededCode);

    if ($.bbq.getState('mode') != 'edit') {
      $("#executeBtn").trigger('click');
    }
  }
  else {
    // select a canned example on start-up:
    $("#aliasExampleLink").trigger('click');
  }


  // log a generic AJAX error handler
  $(document).ajaxError(function() {
    alert("Server error (possibly due to memory/resource overload).");

    $('#executeBtn').html("Visualize execution");
    $('#executeBtn').attr('disabled', false);
  });


  // redraw connector arrows on window resize
  $(window).resize(function() {
    if (appMode == 'visualize') {
      myVisualizer.redrawConnectors();
    }
  });

  $('#genUrlBtn').bind('click', function() {
    var urlStr = $.param.fragment(window.location.href,
                                  {code: pyInputCodeMirror.getValue(),
                                   curInstr: (appMode == 'visualize') ? myVisualizer.curInstr : 0,
                                   mode: appMode,
                                   cumulative_mode: $('#cumulativeMode').prop('checked')
                                  },
                                  2);
    $('#urlOutput').val(urlStr);
  });
});

