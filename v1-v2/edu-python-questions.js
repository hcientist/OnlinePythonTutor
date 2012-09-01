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

// UI for online problem sets

// Pre-req: edu-python.js and jquery.ba-bbq.min.js should be imported BEFORE this file


// parsed form of a questions file from questions/
var curQuestion = null;


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

  // this doesn't work since we need jquery.textarea.js ...
  //$("#actualCodeInput").tabby(); // recognize TAB and SHIFT-TAB
  //$("#testCodeInput").tabby();   // recognize TAB and SHIFT-TAB


  // be friendly to the browser's forward and back buttons
  // thanks to http://benalman.com/projects/jquery-bbq-plugin/
  $(window).bind("hashchange", function(e) {
    appMode = $.bbq.getState("mode"); // assign this to the GLOBAL appMode

    // default mode is 'edit'
    if (appMode == undefined) {
      appMode = 'edit';
    }

    // if there's no curTrace, then default to edit mode since there's
    // nothing to visualize or grade:
    if (!curTrace) {
      appMode = 'edit';
      $.bbq.pushState({ mode: 'edit' });
    }


    if (appMode == 'edit') {
      $("#pyInputPane").show();
      $("#pyOutputPane").hide();
      $("#pyGradingPane").hide();

      $("#HintStatement").show();
      $("#SolutionStatement").show();
    }
    else if (appMode == 'visualize') {
      $("#pyInputPane").hide();
      $("#pyOutputPane").show();
      $("#pyGradingPane").hide();

      $("#HintStatement").show();
      $("#SolutionStatement").show();

      $('#submitBtn').html("Submit answer");
      $('#submitBtn').attr('disabled', false);

      $('#executeBtn').html("Visualize execution");
      $('#executeBtn').attr('disabled', false);


      // do this AFTER making #pyOutputPane visible, or else
      // jsPlumb connectors won't render properly
      processTrace(curTrace /* kinda dumb and redundant */, true);

      // don't let the user submit answer when there's an error
      var hasError = false;
      for (var i = 0; i < curTrace.length; i++) {
         var curEntry = curTrace[i];
         if (curEntry.event == 'exception' ||
             curEntry.event == 'uncaught_exception') {
           hasError = true;
           break;
         }
      }
      $('#submitBtn').attr('disabled', hasError);
    }
    else if (appMode == 'grade') {
      $("#gradeMatrix #gradeMatrixTbody").empty(); // clear it!!!

      $("#pyInputPane").hide();
      $("#pyOutputPane").hide();
      $("#pyGradingPane").show();

      $("#HintStatement").hide();
      $("#SolutionStatement").hide();

      gradeSubmission();
    }
  });


  // From: http://benalman.com/projects/jquery-bbq-plugin/
  //   Since the event is only triggered when the hash changes, we need
  //   to trigger the event now, to handle the hash the page may have
  //   loaded with.
  $(window).trigger( "hashchange" );


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
  // use rtrim to get rid of trailing whitespace and newlines
  return solnCode.rtrim() + "\n\n# Everything below here is test code\n" + testCode;
}


function enterEditMode() {
  $.bbq.pushState({ mode: 'edit' });
}

function enterVisualizeMode(traceData) {
  curTrace = traceData; // first assign it to the global curTrace, then
                        // let jQuery BBQ take care of the rest
  $.bbq.pushState({ mode: 'visualize' });
}

function enterGradingMode() {
  $.bbq.pushState({ mode: 'grade' });
}


// returns a closure!
function genTestResultHandler(idx) {
  function ret(res) {
    assert(testResults[idx] === null);
    testResults[idx] = res;

    // if ALL results have been successfully delivered, then call
    // enterGradingMode() (remember that each result comes in
    // asynchronously and probably out-of-order)

    for (var i = 0; i < testResults.length; i++) {
      if (testResults[i] === null) {
        return;
      }
    }

    enterGradingMode();
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
  curQuestion = questionsDat; // initialize global

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

    if (curQuestion.max_line_delta) {
      // if the question has a 'max_line_delta' field, then check to see
      // if > curQuestion.max_line_delta lines have changed from
      // curQuestion.skeleton, and reject the attempt if that's the case
      var numChangedLines = 0;

      // split on newlines to do a line-level diff
      // (rtrim both strings to discount the effect of trailing
      // whitespace and newlines)
      var diffResults = diff($("#actualCodeInput").val().rtrim().split(/\n/), questionsDat.skeleton.rtrim().split(/\n/));
      //console.log(diffResults);
      $.each(diffResults, function(i, e) {
        if (e.file1 && e.file2) {
          // i THINK this is the right way to calculate the number of
          // changed lines ... taking the MAXIMUM of the delta lengths
          // of e.file1 and e.file2:
          numChangedLines += Math.max(e.file1.length, e.file2.length);
        }
      });

      if (numChangedLines > curQuestion.max_line_delta) {
        alert("Error: You have changed " + numChangedLines + " lines of code, but you are only allowed to change " + curQuestion.max_line_delta + " lines to solve this problem.");
        return;
      }
    }

    $('#executeBtn').html("Please wait ... processing your code");
    $('#executeBtn').attr('disabled', true);
    $("#pyOutputPane").hide();

    var submittedCode = concatSolnTestCode($("#actualCodeInput").val(), $("#testCodeInput").val());

    var postParams = {user_script : submittedCode};
    if (questionsDat.max_instructions) {
      postParams.max_instructions = questionsDat.max_instructions;
    }

    $.post("cgi-bin/web_exec.py",
           postParams,
           function(traceData) {
             renderPyCodeOutput(submittedCode);
             enterVisualizeMode(traceData);
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

      var postParams = {user_script : submittedCode, expect_script : expects[i]};
      if (questionsDat.max_instructions) {
        postParams.max_instructions = questionsDat.max_instructions;
      }

      $.post("cgi-bin/web_run_test.py",
             postParams,
             genTestResultHandler(i),
             "json");
    }
  });
}


// should be called after ALL elements in testsTraces and expectsTraces
// have been populated by their respective AJAX POST calls
function gradeSubmission() {
  $("#submittedCodePRE").html(htmlspecialchars($("#actualCodeInput").val()));

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

          curCell.find('table.testInputTable tr.testInputVarRow:last').append('<td class="testInputVarnameCell">' + k + ':</td>');

          curCell.find('table.testInputTable tr.testInputVarRow:last').append('<td class="testInputValCell"></td>');
          renderData(v, curCell.find('table.testInputTable td.testInputValCell:last'), true /* ignoreIDs */);
        }
      }
    }

    if (res.status == 'error') {
      $("#gradeMatrix tr.gradeMatrixRow:last").append('<td class="testOutputCell"><span style="color: ' + darkRed + '">' + res.error_msg + '</span></td>');
    }
    else {
      assert(res.status == 'ok');
      $("#gradeMatrix tr.gradeMatrixRow:last").append('<td class="testOutputCell"></td>');

      var curCell = $("#gradeMatrix tr.gradeMatrixRow:last td.testOutputCell:last");
      curCell.append('<table><tr class="testOutputVarRow"></tr></table>');

      curCell.find('tr.testOutputVarRow:last').append('<td class="testOutputVarnameCell">' + res.output_var_to_compare + ':</td>');

      curCell.find('tr.testOutputVarRow:last').append('<td class="testOutputValCell"></td>');
      renderData(res.test_val, curCell.find('td.testOutputValCell:last'), true /* ignoreIDs */);
    }


    if (res.passed_test) {
      var happyFaceImg = '<img style="vertical-align: middle;" src="yellow-happy-face.png"/>';
      $("#gradeMatrix tr.gradeMatrixRow:last").append('<td class="statusCell">' + happyFaceImg + '</td>');

      // add an empty 'expected' cell
      $("#gradeMatrix tr.gradeMatrixRow:last").append('<td class="expectedCell"></td>');
    }
    else {
      var sadFaceImg = '<img style="vertical-align: middle; margin-right: 8px;" src="red-sad-face.jpg"/>';

      var debugBtnID  = 'debug_test_' + i;
      var debugMeBtn = '<button id="' + debugBtnID + '" class="debugBtn" type="button">Debug me</button>';
      var expectedTd = '<td class="expectedCell">Expected: </td>';

      $("#gradeMatrix tr.gradeMatrixRow:last").append('<td class="statusCell">' + sadFaceImg + debugMeBtn + '</td>' + expectedTd);

      renderData(res.expect_val,
                 $("#gradeMatrix tr.gradeMatrixRow:last td.expectedCell:last"),
                 true /* ignoreIDs */);

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
