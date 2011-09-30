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

  $("#pyInputPane").hide();
  $("#pyOutputPane").hide();
  $("#pyGradingPane").show();

  $("#HintStatement").hide();
  $("#SolutionStatement").hide();
}


// returns a curried function!
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
  $("#submittedCodeRO").val($("#actualCodeInput").val());

  for (var i = 0; i < tests.length; i++) {
    var res = testResults[i];

    $("#gradeMatrix tbody").append('<tr class="gradeMatrixRow"></tr>');

    $("#gradeMatrix tr.gradeMatrixRow:last").append('<td class="testInputCell"></td>');

    // input_val could be null if there's a REALLY bad error :(
    if (res.input_globals) {
      //console.log(i, res.input_globals);

      // TODO: create a div for every NON-function element of input_globals

      //renderData(res.input_val,
      //           $("#gradeMatrix tr.gradeMatrixRow:last td.testInputCell:last"),
      //           true /* ignoreIDs */);
    }

    if (res.status == 'error') {
      $("#gradeMatrix tr.gradeMatrixRow:last").append('<td class="testOutputCell">' + res.error_msg + '</td>');
    }
    else {
      assert(res.status == 'ok');
      $("#gradeMatrix tr.gradeMatrixRow:last").append('<td class="testOutputCell"></td>');

      $("#gradeMatrix tr.gradeMatrixRow:last td.testOutputCell:last").append(res.output_var_to_compare + ' = ');
      renderData(res.test_val,
                 $("#gradeMatrix tr.gradeMatrixRow:last td.testOutputCell:last"),
                 true /* ignoreIDs */);
    }

    if (res.passed_test) {
      $("#gradeMatrix tr.gradeMatrixRow:last").append('<td><img style="vertical-align: middle;" src="yellow-happy-face.png"/></td>');
    }
    else {
      $("#gradeMatrix tr.gradeMatrixRow:last").append('<td><img style="vertical-align: middle; margin-right: 4px;" src="red-sad-face.jpg"/> <span><a href="#">Debug me</a></span></td>');
    }

  }
}
