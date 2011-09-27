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

  $("#pyOutputPane").hide();

  // for demo purposes ...


  $("#executeBtn").attr('disabled', false);
  $("#executeBtn").click(function() {
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

