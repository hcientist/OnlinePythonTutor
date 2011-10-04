/*

Online Python Tutor
Copyright (C) 2010-2011 Philip J. Guo (philip@pgbovine.net)
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

// Pre-req: edu-python.js and jquery.ba-bbq.min.js should be imported BEFORE this file


function enterEditMode() {
  $.bbq.pushState({ mode: 'edit' });
}

function enterVisualizeMode(traceData) {
  curTrace = traceData; // first assign it to the global curTrace, then
                        // let jQuery BBQ take care of the rest
  $.bbq.pushState({ mode: 'visualize' });
}


$(document).ready(function() {
  eduPythonCommonInit(); // must call this first!

  $("#pyInput").tabby(); // recognize TAB and SHIFT-TAB


  // be friendly to the browser's forward and back buttons
  // thanks to http://benalman.com/projects/jquery-bbq-plugin/
  $(window).bind("hashchange", function(e) {
    appMode = $.bbq.getState("mode"); // assign this to the GLOBAL appMode

    // default mode is 'edit'
    if (appMode == undefined) {
      appMode = 'edit';
    }

    // if there's no curTrace, then default to edit mode since there's
    // nothing to visualize:
    if (!curTrace) {
      appMode = 'edit';
      $.bbq.pushState({ mode: 'edit' });
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
      processTrace(curTrace /* kinda dumb and redundant */, false);
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

    $.post("cgi-bin/web_exec.py",
           {user_script : $("#pyInput").val()},
           function(traceData) {
             renderPyCodeOutput($("#pyInput").val());
             enterVisualizeMode(traceData);
           },
           "json");
  });


  $("#editBtn").click(function() {
    enterEditMode();
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


  // select an example on start-up:
  $("#aliasExampleLink").trigger('click');
});

