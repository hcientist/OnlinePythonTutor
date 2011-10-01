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


// matching arrays of test code and 'expected outputs' from those tests
var tests = null;
var expects = null;
var curTestIndex = -1;

// the results returned by executing the respective 'tests' and 'expects'
// Python code.  See resetTestResults for invariants.
var testResults = null;

// Pre: 'tests' and 'expects' are non-null
function resetTestResults() {
  testResults = [];
  $.each(tests, function(i) {
    testResults.push(null);
  });

  assert(testResults.length > 0);
  assert(testResults.length == tests.length);
}


$(document).ready(function() {
  eduPythonCommonInit(); // must call this first!

  enterEditMode();

  $("#actualCodeInput").tabby(); // recognize TAB and SHIFT-TAB
  $("#testCodeInput").tabby();   // recognize TAB and SHIFT-TAB


  // load the questions file specified by the query string
  var questionsFilename = location.search.substring(1);

  $.get("cgi-bin/load_question.py",
        {question_file : questionsFilename},
        function(questionsDat) {
          finishQuestionsInit(questionsDat);
        },
        "json");

});


// concatenate solution code and test code:
function concatSolnTestCode(solnCode, testCode) {
  var filler = (solnCode[solnCode.length - 1] != '\n') ? '\n' : '';
  return solnCode + filler + "\n# Everything below here is test code\n" + testCode;
}


function enterEditMode() {
  appMode = 'edit';

  $("#pyInputPane").show();
  $("#pyOutputPane").hide();
  $("#pyGradingPane").hide();

  $("#HintStatement").show();
  $("#SolutionStatement").show();
}

function enterVisualizeMode() {
  appMode = 'visualize';

  $("#pyInputPane").hide();
  $("#pyOutputPane").show();
  $("#pyGradingPane").hide();

  $("#HintStatement").show();
  $("#SolutionStatement").show();

  $('#submitBtn').html("Submit answer");
  $('#submitBtn').attr('disabled', false);
}

function enterGradingMode() {
  appMode = 'grade';

  $("#gradeMatrix #gradeMatrixTbody").empty(); // clear it!!!

  $("#pyInputPane").hide();
  $("#pyOutputPane").hide();
  $("#pyGradingPane").show();

  $("#HintStatement").hide();
  $("#SolutionStatement").hide();
}


// returns a closure!
function genTestResultHandler(idx) {
  function ret(res) {
    assert(testResults[idx] === null);
    testResults[idx] = res;

    // if ALL results have been delivered, then call
    // readyToGradeSubmission() ... (remember that each result comes in
    // asynchronously and probably out-of-order)
    for (var i = 0; i < testResults.length; i++) {
      if (testResults[i] === null) {
        return;
      }
    }

    readyToGradeSubmission();
  }

  return ret;
}

function genDebugLinkHandler(failingTestIndex) {
  function ret() {
    // Switch back to visualize mode, populating the "testCodeInput"
    // field with the failing test case, and RE-RUN the back-end to
    // visualize execution (this time with proper object IDs)
    curTestIndex = failingTestIndex;
    $("#testCodeInput").val(tests[curTestIndex]);

    // prevent multiple-clicking ...
    $(this).html("One sec ...");
    $(this).attr('disabled', true);

    $("#executeBtn").trigger('click'); // emulate an execute button press!
  }

  return ret;
}


function finishQuestionsInit(questionsDat) {
  $("#ProblemName").html(questionsDat.name);
  $("#ProblemStatement").html(questionsDat.question);

  $("#showHintHref").click(function() {
    $("#HintStatement").html("<b>Hint</b>: " + questionsDat.hint);
    return false; // don't reload the page
  });

  $("#showSolutionHref").click(function() {
    $("#SolutionStatement").html("<b>Solution</b>: " + questionsDat.solution);
    return false; // don't reload the page
  });


  $("#actualCodeInput").val(questionsDat.skeleton);


  // set some globals
  tests = questionsDat.tests;
  expects = questionsDat.expects;
  curTestIndex = 0;

  resetTestResults();


  $("#testCodeInput").val(tests[curTestIndex]);


  $("#executeBtn").attr('disabled', false);
  $("#executeBtn").click(function() {
    $('#executeBtn').html("Please wait ... processing your code");
    $('#executeBtn').attr('disabled', true);
    $("#pyOutputPane").hide();

    var submittedCode = concatSolnTestCode($("#actualCodeInput").val(), $("#testCodeInput").val());

    $.post("cgi-bin/web_exec.py",
           {user_script : submittedCode},
           function(traceData) {
             renderPyCodeOutput(submittedCode);

             enterVisualizeMode();

             $('#executeBtn').html("Visualize execution");
             $('#executeBtn').attr('disabled', false);

             // do this AFTER making #pyOutputPane visible, or else
             // jsPlumb connectors won't render properly
             processTrace(traceData, true);
           },
           "json");
  });


  $("#editBtn").click(function() {
    enterEditMode();
  });


  $("#submitBtn").click(function() {
    $('#submitBtn').html("Please wait ... submitting ...");
    $('#submitBtn').attr('disabled', true);

    resetTestResults(); // prepare for a new fresh set of test results

    // remember that these results come in asynchronously and probably
    // out-of-order, so code very carefully here!!!
    for (var i = 0; i < tests.length; i++) {
      var submittedCode = concatSolnTestCode($("#actualCodeInput").val(), tests[i]);
      $.post("cgi-bin/web_run_test.py",
             {user_script : submittedCode, expect_script : expects[i]},
             genTestResultHandler(i),
             "json");
    }
  });

}


// should be called after ALL elements in testsTraces and expectsTraces
// have been populated by their respective AJAX POST calls
function readyToGradeSubmission() {
  enterGradingMode();

  $("#submittedCodePRE").html(htmlspecialchars($("#actualCodeInput").val()));
  //$("#submittedCodeRO").val($("#actualCodeInput").val());

  for (var i = 0; i < tests.length; i++) {
    var res = testResults[i];

    $("#gradeMatrix tbody#gradeMatrixTbody").append('<tr class="gradeMatrixRow"></tr>');

    $("#gradeMatrix tr.gradeMatrixRow:last").append('<td class="testInputCell"></td>');

    // input_val could be null if there's a REALLY bad error :(
    if (res.input_globals) {
      var curCell = $("#gradeMatrix tr.gradeMatrixRow:last td.testInputCell:last");

      curCell.append('<table class="testInputTable"></table>');

      // print out all non-function input global variables in a table
      for (k in res.input_globals) {
        var v = res.input_globals[k];
        if (isPrimitiveType(v) || v[0] != 'function') {
          curCell.find('table.testInputTable').append('<tr class="testInputVarRow"></tr>');
          curCell.find('table.testInputTable tr.testInputVarRow:last').append('<td class="testInputVarnameCell">' + k + '</td>');

          curCell.find('table.testInputTable tr.testInputVarRow:last').append('<td class="testInputValCell"></td>');
          renderData(v, curCell.find('table.testInputTable td.testInputValCell:last'), true /* ignoreIDs */);
        }
      }
    }

    if (res.status == 'error') {
      $("#gradeMatrix tr.gradeMatrixRow:last").append('<td class="testOutputCell"><span style="padding: 5px; background-color: ' + errorColor + ';">' + res.error_msg + '</span></td>');
    }
    else {
      assert(res.status == 'ok');
      $("#gradeMatrix tr.gradeMatrixRow:last").append('<td class="testOutputCell"></td>');

      var curCell = $("#gradeMatrix tr.gradeMatrixRow:last td.testOutputCell:last");
      curCell.append('<table><tr class="testOutputVarRow"></tr></table>');

      curCell.find('tr.testOutputVarRow:last').append('<td class="testOutputVarnameCell">' + res.output_var_to_compare + '</td>');

      curCell.find('tr.testOutputVarRow:last').append('<td class="testOutputValCell"></td>');
      renderData(res.test_val, curCell.find('td.testOutputValCell:last'), true /* ignoreIDs */);
    }


    if (res.passed_test) {
      var happyFaceImg = '<img style="vertical-align: middle;" src="yellow-happy-face.png"/>';
      $("#gradeMatrix tr.gradeMatrixRow:last").append('<td>' + happyFaceImg + '</td>');
    }
    else {
      var sadFaceImg = '<img style="vertical-align: middle; margin-right: 8px;" src="red-sad-face.jpg"/>';

      var debugBtnID  = 'debug_test_' + i;
      var debugMeBtn = '<button id="' + debugBtnID + '" class="debugBtn" type="button">Debug me</button>';

      $("#gradeMatrix tr.gradeMatrixRow:last").append('<td>' + sadFaceImg + debugMeBtn + '</td>');

      $('#' + debugBtnID).unbind(); // unbind it just to be paranoid
      $('#' + debugBtnID).click(genDebugLinkHandler(i));
    }
  }


  var numPassed = 0;
  for (var i = 0; i < tests.length; i++) {
    var res = testResults[i];
    if (res.passed_test) {
      numPassed++;
    }
  }

  if (numPassed < tests.length) {
    $("#gradeSummary").html('Your submitted answer passed ' + numPassed + ' out of ' + tests.length + ' tests.  Try to debug the failed tests!');
  }
  else {
    assert(numPassed == tests.length);
    $("#gradeSummary").html('Congrats, your submitted answer passed all ' + tests.length + ' tests!');
  }

}
