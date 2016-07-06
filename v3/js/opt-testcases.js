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
// - jquery-1.8.2.min.js
// - pytutor.js
// - opt-frontend-common.js
// - ace/src-min-noconflict/ace.js
// should all be imported BEFORE this file


var testcasesPaneHtml = '\
<table id="testCasesTable">\
  <thead>\
  <tr>\
    <td style="width: 310px">Tests</td>\
    <td><button id="runAllTestsButton" type="button">Run All Tests</button></td>\
    <td>Results</td>\
    <td></td>\
    <td></td>\
  </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table>\
\
<a href="#" id="addNewTestCase">Add new test</a>\
'

function initTestcasesPane(parentDivId, onChangeCallback /* optional */) {
  $(parentDivId).empty(); // just to be paranoid, empty this out
                          // (and its event handlers, too, supposedly)
  $(parentDivId).html(testcasesPaneHtml);

  $("#addNewTestCase").click(function() {
    addTestcase(null, onChangeCallback);
    return false; // to prevent link from being followed
  });

  $("#runAllTestsButton").click(function() {
    $(".runTestCase").click();
  });
}

function getCombinedCode(id) {
  var userCod = pyInputGetValue();
  var testCod = ace.edit('testCaseEditor_' + id).getValue();
  // for reporting syntax errors separately for user and test code
  var userCodNumLines = userCod.split('\n').length;

  var lang = $('#pythonVersionSelector').val();
  if (lang === 'ts' || lang === 'js' || lang === 'java') {
    var bufferCod = '\n\n// Test code //\n';
  } else {
    var bufferCod = '\n\n## Test code ##\n';
  }

  var bufferCodNumLines = bufferCod.split('\n').length;

  var combinedCod = userCod + bufferCod + testCod;
  return {cod: combinedCod,
          firstTestLine: userCodNumLines + bufferCodNumLines - 1};
}

function startRunningTest(id) {
  $("#runAllTestsButton,.runTestCase,.vizTestCase").attr('disabled', true);
  var e = ace.edit('testCaseEditor_' + id);
  e.getSession().clearAnnotations();
  $('#outputTd_' + id).html('');
}

function doneRunningTest() {
  $("#runAllTestsButton,.runTestCase,.vizTestCase").attr('disabled', false);
  $(".runTestCase").html('Run');
  $(".vizTestCase").html('Visualize');
}

function runTestFinishSuccessfulExecution() {
  doneRunningTest();
}

function vizTestFinishSuccessfulExecution() {
  optFinishSuccessfulExecution();
  doneRunningTest();
}


var curTestcaseId = 1;

function addTestcase(initialCod /* optional code to pre-seed this test */,
                     onChangeCallback /* to be called if this elt changes */) {
  var id = curTestcaseId;
  curTestcaseId++; // nasty global
  var newTr = $('<tr/>').attr('id', 'testCaseRow_' + id);
  $("#testCasesTable tbody").append(newTr);
  var editorTd = $('<td/>');
  var runBtnTd = $('<td/>');
  var outputTd = $('<td/>');
  var visualizeTd = $('<td/>');
  var deleteTd = $('<td/>');

  editorTd.append('<div id="testCaseEditor_' + id + '" class="testCaseEditor">');
  runBtnTd.append('<button id="runTestCase_' + id + '" class="runTestCase" type="button">Run</button>');
  outputTd.attr('id', 'outputTd_' + id);
  outputTd.attr('class', 'outputTd');
  visualizeTd.append('<button id="vizTestCase_' + id + '" class="vizTestCase" type="button">Visualize</button>');
  deleteTd.append('<a id="delTestCase_' + id + '" href="javascript:void(0);">Delete test</a></td>');

  newTr.append(editorTd);
  newTr.append(runBtnTd);
  newTr.append(outputTd);
  newTr.append(visualizeTd);
  newTr.append(deleteTd);


  // initialize testCaseEditor with Ace:
  var te = ace.edit('testCaseEditor_' + id);
  // set the size and value ASAP to get alignment working well ...
  te.setOptions({minLines: 2, maxLines: 4}); // keep this SMALL
  te.setHighlightActiveLine(false);
  te.setShowPrintMargin(false);
  te.setBehavioursEnabled(false);
  te.setFontSize(11);
  //te.setReadOnly(true);

  var s = te.getSession();
  s.setTabSize(2);
  s.setUseSoftTabs(true);
  // disable extraneous indicators:
  s.setFoldStyle('manual'); // no code folding indicators
  // don't do real-time syntax checks:
  // https://github.com/ajaxorg/ace/wiki/Syntax-validation
  s.setOption("useWorker", false);

  // TODO: change syntax highlighting mode if the user changes languages:
  var lang = $('#pythonVersionSelector').val();
  var mod = 'python';
  var defaultVal = '\n# assert <test condition>';
  if (lang === 'java') {
    mod = 'java';
    defaultVal = '// sorry, Java tests not yet supported';
  } else if (lang === 'js') {
    mod = 'javascript';
    defaultVal = '\n// console.assert(<test condition>);';
  } else if (lang === 'ts') {
    mod = 'typescript';
    defaultVal = '\n// console.assert(<test condition>);';
  } else if (lang === 'ruby') {
    mod = 'ruby';
    defaultVal = "\n# raise 'fail' unless <test condition>";
  }
  s.setMode("ace/mode/" + mod);

  // detect when the buffer has changed
  s.on("change", function() {
    if (onChangeCallback) {
      onChangeCallback();
    }
  });

  te.setValue(initialCod ? initialCod.rtrim() : defaultVal,
              -1 /* do NOT select after setting text */);

  function runOrVizTestCase(isViz /* true for visualize, false for run */) {
    if (isViz) {
      $('#vizTestCase_' + id).html("Visualizing ...");
    } else {
      $('#runTestCase_' + id).html("Running ...");
    }

    startRunningTest(id);
    var dat = getCombinedCode(id);

    // adapted from executeCode in opt-frontend.js
    var backend_script = langToBackendScript($('#pythonVersionSelector').val());
    var backendOptionsObj = getBaseBackendOptionsObj();
    var frontendOptionsObj = getBaseFrontendOptionsObj();
    frontendOptionsObj.jumpToEnd = true;

    if (isViz) {
      backendOptionsObj.viz_test_case = true; // just so we can see this in server logs
      activateSyntaxErrorSurvey = false; // NASTY global! disable this survey when running test cases since it gets confusing
    } else {
      backendOptionsObj.run_test_case = true; // just so we can see this in server logs
      frontendOptionsObj.runTestCaseCallback = function(trace) {
        // scan through the trace to find any exception events. report
        // the first one if found, otherwise assume test is 'passed'
        var exceptionMsg = null;
        trace.forEach(function(e) {
          if (exceptionMsg) {
            return;
          }

          if (e.event === 'exception') {
            exceptionMsg = e.exception_msg;
          }
        });

        if (exceptionMsg) {
          $('#outputTd_' + id).html('<img src="red-sad-face.jpg"></img>');
        } else {
          $('#outputTd_' + id).html('<img src="yellow-happy-face.jpg"></img>');
        }
      };
    }

    function runTestHandleUncaughtExceptionFunc(trace) {
      if (trace.length == 1 && trace[0].line) {
        var errorLineNo = trace[0].line;
        // highlight the faulting line in the test case pane itself
        if (errorLineNo !== undefined &&
            errorLineNo != NaN &&
            errorLineNo >= dat.firstTestLine) {
          var adjustedErrorLineNo = errorLineNo - dat.firstTestLine;
          s.setAnnotations([{row: adjustedErrorLineNo,
                             type: 'error',
                             text: trace[0].exception_msg}]);
          te.gotoLine(adjustedErrorLineNo + 1 /* one-indexed */);
        }
      }

      var msg = trace[0].exception_msg;
      var trimmedMsg = msg.split(':')[0];
      $('#outputTd_' + id).html(htmlspecialchars(trimmedMsg));

      handleUncaughtExceptionFunc(trace);
      doneRunningTest();
    }

    executeCodeAndCreateViz(dat.cod,
                            backend_script, backendOptionsObj,
                            frontendOptionsObj,
                            'pyOutputPane',
                            isViz ? vizTestFinishSuccessfulExecution :
                                    runTestFinishSuccessfulExecution,
                            runTestHandleUncaughtExceptionFunc);
  }

  $('#runTestCase_' + id).click(runOrVizTestCase.bind(null, false));
  $('#vizTestCase_' + id).click(runOrVizTestCase.bind(null, true));

  $('#delTestCase_' + id).click(function() {
    // confirm() not supported within Office Mix labs :/
    //var res = confirm("Press OK to delete this test.");

    $('#testCaseRow_' + id).remove();
    if (onChangeCallback) {
      onChangeCallback();
    }
    return false; // to prevent link from being followed
  });

  if (onChangeCallback) {
    onChangeCallback();
  }
}

// returns a list of strings, each of which is a test case
function getAllTestcases() {
  return $.map($("#testCasesTable .testCaseEditor"), function(e) {
    var editor = ace.edit($(e).attr('id'));
    return editor.getValue();
  });
}

// see getAppState to see where it calls out to this function:
function appStateAugmenter(appState) {
  var tc = getAllTestcases();
  if (tc.length > 0) {
    appState['testCasesJSON'] = JSON.stringify(tc);
  }
}
