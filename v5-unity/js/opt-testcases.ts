// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

export const redSadFace = require('./images/red-sad-face.jpg');
export const yellowHappyFace = require('./images/yellow-happy-face.jpg');


const testcasesPaneHtml = '\
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

export class OptTestcases {
  parent: any; // type: OptFrontendWithTestcases
  curTestcaseId: number = 1;

  constructor(parent) {
    this.parent = parent;
    $("#testCasesParent")
      .empty() // just to be paranoid, empty this out (and its event handlers, too, supposedly)
      .html('<p style="margin-top: 25px;"><a href="#" id="createTestsLink">Create test cases</a></p><div id="testCasesPane"></div>');

    $("#testCasesParent #createTestsLink").click(() => {
      this.initTestcasesPane();
      $("#testCasesParent #createTestsLink").hide();
      return false;
    });
  }

  initTestcasesPane() {
    var _me = this;
    $("#testCasesParent #testCasesPane")
      .empty() // just to be paranoid, empty this out (and its event handlers, too, supposedly)
      .html(testcasesPaneHtml);

    $("#addNewTestCase").click(function() {
      _me.addTestcase(null);
      return false; // to prevent link from being followed
    });

    $("#runAllTestsButton").click(function() {
      $(".runTestCase").click();
    });
  }

  loadTestCases(lst: string[]) {
    this.initTestcasesPane();
    $("#testCasesParent #createTestsLink").hide();
    lst.forEach((e) => {
      this.addTestcase(e);
    });
  }

  addTestcase(initialCod /* optional code to pre-seed this test */) {
    var _me = this;

    var id = this.curTestcaseId;
    this.curTestcaseId++;
    var newTr = $('<tr/>').attr('id', 'testCaseRow_' + id);
    $("#testCasesParent #testCasesTable tbody").append(newTr);
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
    te.setFontSize('11px');
    te.$blockScrolling = Infinity; // kludgy to shut up weird warnings

    var s = te.getSession();
    s.setTabSize(2);
    s.setUseSoftTabs(true);
    // disable extraneous indicators:
    s.setFoldStyle('manual'); // no code folding indicators
    // don't do real-time syntax checks:
    // https://github.com/ajaxorg/ace/wiki/Syntax-validation
    s.setOption("useWorker", false);
    s.on("change", (e) => {
      $('#outputTd_' + id).empty(); // remove all test output indicators
    });

    // TODO: change syntax highlighting mode if the user changes languages:
    var lang = $('#pythonVersionSelector').val();
    var mod = 'python';
    var defaultVal = '\n# assert <test condition>';
    if (lang === 'java') {
      mod = 'java';
      defaultVal = '// sorry, Java tests not yet supported';
    } else if (lang === 'c' || lang === 'cpp') {
      mod = 'c_cpp';
      defaultVal = '// sorry, C/C++ tests not yet supported';
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

    te.setValue(initialCod ? initialCod.rtrim() : defaultVal,
                -1 /* do NOT select after setting text */);
    te.focus();

    function runOrVizTestCase(isViz /* true for visualize, false for run */) {
      $("#runAllTestsButton,.runTestCase,.vizTestCase").attr('disabled', true);
      var e = ace.edit('testCaseEditor_' + id);
      e.getSession().clearAnnotations();
      $('#outputTd_' + id).html('');

      var dat = _me.getCombinedCode(id);
      var cod = dat.cod;

      if (isViz) {
        $('#vizTestCase_' + id).html("Visualizing ...");
        _me.parent.vizTestCase(id, cod, dat.firstTestLine);
      } else {
        $('#runTestCase_' + id).html("Running ...");
        _me.parent.runTestCase(id, cod, dat.firstTestLine);
      }
    }

    $('#runTestCase_' + id).click(runOrVizTestCase.bind(this, false));
    $('#vizTestCase_' + id).click(runOrVizTestCase.bind(this, true));

    $('#delTestCase_' + id).click(function() {
      $('#testCaseRow_' + id).remove();
      return false; // to prevent link from being followed
    });
  }

  doneRunningTest() {
    $("#runAllTestsButton,.runTestCase,.vizTestCase").attr('disabled', false);
    $(".runTestCase").html('Run');
    $(".vizTestCase").html('Visualize');
  }

  getCombinedCode(id) {
    var userCod = this.parent.pyInputGetValue();
    var testCod = ace.edit('testCaseEditor_' + id).getValue();
    // for reporting syntax errors separately for user and test code
    var userCodNumLines = userCod.split('\n').length;

    var lang = $('#pythonVersionSelector').val();
    if (lang === 'ts' || lang === 'js' || lang === 'java' || lang === 'c' || lang === 'cpp') {
      var bufferCod = '\n\n// Test code //\n';
    } else {
      var bufferCod = '\n\n## Test code ##\n';
    }

    var bufferCodNumLines = bufferCod.split('\n').length;

    var combinedCod = userCod + bufferCod + testCod;
    return {cod: combinedCod,
            firstTestLine: userCodNumLines + bufferCodNumLines - 1};
  }

  appStateAugmenter(appState) {
    // returns a list of strings, each of which is a test case
    function getAllTestcases() {
      return $.map($("#testCasesParent #testCasesTable .testCaseEditor"),
      (e) => {
        var editor = ace.edit($(e).attr('id'));
        return editor.getValue();
      });
    }

    var tc = getAllTestcases();
    if (tc.length > 0) {
      appState['testCasesJSON'] = JSON.stringify(tc);
    }
  }

} // END class OptTestcases
