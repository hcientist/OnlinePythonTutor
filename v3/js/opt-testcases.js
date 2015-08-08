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

var curTestcaseId = 1;

function initTestcasesPane(parentDivId) {
  $(parentDivId).html(testcasesPaneHtml);

  $("#addNewTestCase").click(function() {
    addTestcase(curTestcaseId);
    curTestcaseId++;
    return false; // to prevent link from being followed
  });

  $("#addNewTestCase").click(); // for testing
}

function getCombinedCode(id) {
  var userCod = pyInputGetValue();
  var testCod = ace.edit('testCaseEditor_' + id).getValue();
  // for reporting syntax errors separately for user and test code
  var userCodNumLines = userCod.split('\n').length;

  var bufferCod = '\n\n### Test code ###\n';
  var bufferCodNumLines = bufferCod.split('\n').length;

  var combinedCod = userCod + bufferCod + testCod;
  return {cod: combinedCod,
          firstTestLine: userCodNumLines + bufferCodNumLines - 1};
}

function startRunningTest() {
  $("#runAllTestsButton,.runTestCase,.vizTestCase").attr('disabled', true);
}

function doneRunningTest() {
  $("#runAllTestsButton,.runTestCase,.vizTestCase").attr('disabled', false);
  $(".runTestCase").html('Run');
  $(".vizTestCase").html('Visualize');
}

function runTestFinishSuccessfulExecution() {
  optFinishSuccessfulExecution();
  doneRunningTest();
}

function addTestcase(id) {
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
  visualizeTd.append('<button id="vizTestCase_' + id + '" class="vizTestCase" type="button">Visualize</button>');
  deleteTd.append('<a id="delTestCase_' + id + '" href="javascript:void(0);">Delete test</a></td>');

  newTr.append(editorTd);
  newTr.append(runBtnTd);
  newTr.append(outputTd);
  newTr.append(visualizeTd);
  newTr.append(deleteTd);

  $('#runTestCase_' + id).click(function() {
    $(this).html("Running ...");
    startRunningTest();
    var dat = getCombinedCode(id);
    console.log(dat.cod);
    console.log(dat.firstTestLine);
  });

  $('#vizTestCase_' + id).click(function() {
    $(this).html("Visualizing ...");
    startRunningTest();
    var dat = getCombinedCode(id);
    console.log(dat.cod);
    console.log(dat.firstTestLine);

    // adapted from executeCode in opt-frontend.js
    var backend_script = langToBackendScript($('#pythonVersionSelector').val());
    var backendOptionsObj = getBaseBackendOptionsObj();
    var frontendOptionsObj = getBaseFrontendOptionsObj();
    frontendOptionsObj.jumpToEnd = true;

    function runTestHandleUncaughtExceptionFunc(trace) {
      // TODO: use dat.firstTestLine to see if the syntax error is in
      // the test code, and if it is, then display error indicator in
      // the test code gutter and in the 'results' table cell
      // (remember to clear marks on edit, though)
      handleUncaughtExceptionFunc(trace);
      doneRunningTest();
    }

    executeCodeAndCreateViz(dat.cod,
                            backend_script, backendOptionsObj,
                            frontendOptionsObj,
                            'pyOutputPane',
                            runTestFinishSuccessfulExecution,
                            runTestHandleUncaughtExceptionFunc);
  });


  $('#delTestCase_' + id).click(function() {
    var res = confirm("Press OK to delete this test.");
    if (res) {
      $('#testCaseRow_' + id).remove();
    }
    return false; // to prevent link from being followed
  });

  // initialize testCaseEditor with Ace:
  var te = ace.edit('testCaseEditor_' + id);
  // set the size and value ASAP to get alignment working well ...
  te.setOptions({minLines: 2, maxLines: 4}); // keep this SMALL
  te.setHighlightActiveLine(false);
  te.setShowPrintMargin(false);
  te.setBehavioursEnabled(false);
  te.setFontSize(10);
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
  if (lang === 'java') {
    mod = 'java';
  } else if (lang === 'js') {
    mod = 'javascript';
  } else if (lang === 'ts') {
    mod = 'typescript';
  } else if (lang === 'ruby') {
    mod = 'ruby';
  }
  s.setMode("ace/mode/" + mod);
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
    appState['testCases'] = tc;
  }
}
