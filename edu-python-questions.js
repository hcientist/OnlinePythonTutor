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

// UI for online problem sets

// Pre-req: edu-python.js should be imported BEFORE this file


$(document).ready(function() {
  eduPythonCommonInit(); // must call this first!

  $("#actualCodeInput").tabby(); // recognize TAB and SHIFT-TAB
  $("#testCodeInput").tabby();   // recognize TAB and SHIFT-TAB

  $("#pyOutputPane").hide();

  // for demo purposes ...
  var reverseScript =
"def reverse(lst):\n\
    N = len(lst) - 1\n\
    for i in range(N/2):\n\
        tmp = lst[i]\n\
        lst[i] = lst[N-i]\n\
        lst[N-i] = tmp\n";

  var testCode =
"input = ['a', 'b', 'c', 'd', 'e']\n\
reverse(input)\n";

  $("#actualCodeInput").val(reverseScript);
  $("#testCodeInput").val(testCode);

  $("#showHintHref").click(function() {
    $("#HintStatement").html("<b>Hint</b>: Think about swapping pairs of elements.");
    return false; // don't reload the page
  });

  $("#showSolutionHref").click(function() {
    $("#SolutionStatement").html("<b>Solution</b>: Swap the first and last elements, then the second and second-to-last elements, etc.");
    return false; // don't reload the page
  });


  $("#executeBtn").attr('disabled', false);
  $("#executeBtn").click(function() {
    $('#executeBtn').html("Please wait ... processing your code");
    $('#executeBtn').attr('disabled', true);
    $("#pyOutputPane").hide();

    // concatenate the values from #actualCodeInput and #testCodeInput,
    // separated by a comment
    var submittedCode = $("#actualCodeInput").val() +
                        "\n# Everything below here is test code\n" +
                        $("#testCodeInput").val();

    $.post("cgi-bin/web_exec.py",
           {user_script : submittedCode},
           function(traceData) {
             renderPyCodeOutput(submittedCode);
             processTrace(traceData, true);

             $("#pyInputPane").hide();
             $("#pyOutputPane").show();
             appMode = 'visualize';

             $('#executeBtn').html("Visualize execution");
             $('#executeBtn').attr('disabled', false);
           },
           "json");
  });


  $("#editBtn").click(function() {
    $("#pyInputPane").show();
    $("#pyOutputPane").hide();
    appMode = 'edit';
  });
});

