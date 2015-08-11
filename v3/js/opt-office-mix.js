// TODOs:
//

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
// - pytutor.js
// - jquery.ba-bbq.min.js
// - jquery.ba-dotimeout.min.js // for event debouncing: http://benalman.com/code/projects/jquery-dotimeout/examples/debouncing/
// - opt-frontend-common.js
// should all be imported BEFORE this file


var originFrontendJsFile = 'opt-office-mix.js';

// modeled after Kurt's simplelab.ts
var _labEditor = null; // for Edit mode
var _labViewer = null; // for View mode

var _savedCurInstr = undefined; // nasty global
var _lastSavedAppState = undefined; // nasty global


function executeCode(forceStartingInstr, forceRawInputLst) {
  if (forceRawInputLst !== undefined) {
    rawInputLst = forceRawInputLst; // UGLY global across modules, FIXME
  }

  var backend_script = null;
  if ($('#pythonVersionSelector').val() == '2') {
      backend_script = python2_backend_script;
  }
  else if ($('#pythonVersionSelector').val() == '3') {
      backend_script = python3_backend_script;
  }
  else if ($('#pythonVersionSelector').val() == 'js') {
      backend_script = js_backend_script;
  }
  else if ($('#pythonVersionSelector').val() == 'ts') {
      backend_script = ts_backend_script;
  }
  else if ($('#pythonVersionSelector').val() == 'ruby') {
      backend_script = ruby_backend_script;
  }
  else if ($('#pythonVersionSelector').val() == 'java') {
      backend_script = java_backend_script;
  }
  assert(backend_script);

  var backendOptionsObj = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
                           heap_primitives: ($('#heapPrimitivesSelector').val() == 'true'),
                           show_only_outputs: false,
                           py_crazy_mode: false,
                           origin: originFrontendJsFile};

  var startingInstruction = forceStartingInstr ? forceStartingInstr : 0;

  var frontendOptionsObj = {startingInstruction: startingInstruction,
                            embeddedMode: true,

                            // tricky: selector 'true' and 'false' values are strings!
                            disableHeapNesting: ($('#heapPrimitivesSelector').val() == 'true'),
                            textualMemoryLabels: ($('#textualMemoryLabelsSelector').val() == 'true'),
                            executeCodeWithRawInputFunc: executeCodeWithRawInput,

                            // undocumented experimental modes:
                            pyCrazyMode: false, holisticMode: false
                           }

  executeCodeAndCreateViz(pyInputGetValue(),
                          backend_script, backendOptionsObj,
                          frontendOptionsObj,
                          'pyOutputPane',
                          officeMixFinishSuccessfulExecution, handleUncaughtExceptionFunc);
}


function officeMixFinishSuccessfulExecution() {
  updateAppDisplayForMix('display'); // do this first

  $("#executeBtn").attr('disabled', false);
  $("#executeBtn").hide();

  if (_savedCurInstr !== undefined) {
    myVisualizer.renderStep(_savedCurInstr);
    _savedCurInstr = undefined;
  }

  saveCurrentConfiguration();
  // save configuration on every step action
  myVisualizer.add_pytutor_hook("end_updateOutput", function(args) {
    saveCurrentConfiguration();
    return [false]; // pass through to let other hooks keep handling
  });
}


// Adapted from Kurt's simplelab.ts
//
// Returns the lab configuration from the provided data
function getConfigurationFromData(dat) {
    var appVersion = { major: 1, minor: 0 };
    var activityComponent = {
        type: Labs.Components.ActivityComponentType,
        name: "", // XXX: can this be blank?
        values: {},
        data: dat,
        secure: false
    };
    var configuration = {
        appVersion: appVersion,
        components: [activityComponent],
        name: "", // XXX: can this be blank?
        timeline: null,
        analytics: null
    };

    return configuration;
}


// a wrapper for getAppState() that caches the value of the current
// execution trace if we're in display mode
function getAppStateWithTraceCache() {
  var ret = getAppState();

  // only do caching in Mix Edit mode, *not* in View mode, since we
  // don't want to invalidate the original cache entry that was populated
  // in Edit mode just because we're messing around in View mode.
  if (_labEditor /* in Mix Edit mode */ &&
      ret.mode === 'display' /* in OPT Display mode */ &&
      myVisualizer) {
    ret.cachedTrace = myVisualizer.curTrace;
    ret.cachedCod = myVisualizer.curInputCode;
    ret.cachedLang = myVisualizer.params.lang;
  }
  return ret;
}

function enterOPTEditCodeMode() {
  updateAppDisplayForMix('edit');
  $("#executeBtn").html("Visualize Execution").show();
  $("#executeBtn").attr('disabled', false);

  // https://groups.google.com/forum/#!msg/ace-discuss/TQHqey_NkBg/q9x_tLrvsXoJ
  pyInputAceEditor.resize(); // weird hack that's necessary to refresh the editor's latest text values. #weird

  setAceMode(); // for syntax coloring

  saveCurrentConfiguration();
}


function updateAppDisplayForMix(newAppMode) {
  // idempotence is VERY important here
  if (newAppMode == appMode) {
    return;
  }

  appMode = newAppMode; // global!

  if (appMode === undefined || appMode == 'edit' ||
      !myVisualizer /* subtle -- if no visualizer, default to edit mode */) {
    appMode = 'edit'; // canonicalize

    $("#pyInputPane").show();
    $("#pyOutputPane").hide();
    $("#embedLinkDiv").hide();

    // Potentially controversial: when you enter edit mode, DESTROY any
    // existing visualizer object. note that this simplifies the app's
    // conceptual model but breaks the browser's expected Forward and
    // Back button flow
    $("#pyOutputPane").empty();
    myVisualizer = null;

    $.bbq.pushState({ mode: 'edit' }, 2 /* completely override other hash strings to keep URL clean */);
  } else if (appMode == 'display' || appMode == 'visualize' /* 'visualize' is deprecated */) {
    assert(myVisualizer);
    appMode = 'display'; // canonicalize

    $("#pyInputPane").hide();
    $("#pyOutputPane").show();
    $("#embedLinkDiv").show();

    doneExecutingCode();

    // do this AFTER making #pyOutputPane visible, or else
    // jsPlumb connectors won't render properly
    myVisualizer.updateOutput();

    // customize edit button click functionality AFTER rendering (NB: awkward!)
    $('#pyOutputPane #editCodeLinkDiv').show();
    $('#pyOutputPane #editBtn').click(function() {
      enterOPTEditCodeMode();
    });

    $.bbq.pushState({ mode: 'display' }, 2 /* completely override other hash strings to keep URL clean */);
  } else {
    assert(false);
  }
}


// note that nothing in 'configuration' is saved when in View mode,
// since that's previewing how end-users will interact with the lab
function officeMixEnterViewMode() {
  if (_labEditor) {
    _labEditor.done(function() { _labEditor = null; });
  }

  Labs.takeLab(function(err, labInstance) {
    if (labInstance) {
      _labViewer = labInstance; // global

      myVisualizer = null; // clear this before doing anything else, so
                           // that we don't accidentally invalidate cache
      var savedAppState = _labViewer.components[0].component.data;

      // very important so that trace cache can work when loading a saved Mix:
      if (_lastSavedAppState === undefined) {
        _lastSavedAppState = savedAppState;
      }

      setToggleOptions(savedAppState);
      if (savedAppState.code) {
        pyInputSetValue(savedAppState.code);
        if (savedAppState.mode === 'display') {
          _savedCurInstr = savedAppState.curInstr; // #crufty
          mixLazyExecuteCode();
        }
      }

      if (savedAppState.testCasesJSON) {
        var testCasesLst = JSON.parse(savedAppState.testCasesJSON);
        $("#createTestsLink").hide();
        initTestcasesPane('#testCasesPane', saveCurrentConfiguration);
        testCasesLst.forEach(function(e) {
          addTestcase(e, saveCurrentConfiguration);
        });
      }

      if (savedAppState.mode === 'edit') {
        enterOPTEditCodeMode();
      }
    }
  });
}

function officeMixEnterEditMode() {
  if (_labViewer) {
    _labViewer.done(function() { _labViewer = null; });
  }

  Labs.editLab(function(err, labEditor) {
    if (labEditor) {
      _labEditor = labEditor; // global

      // this seems to run every time editLab runs
      _labEditor.getConfiguration(function(err, configuration) {
        if (configuration) {
          myVisualizer = null; // clear this before doing anything else, so
                               // that we don't accidentally invalidate cache
          var savedAppState = configuration.components[0].data;

          // very important so that trace cache can work when loading a saved Mix:
          if (_lastSavedAppState === undefined) {
            _lastSavedAppState = savedAppState;
          }

          setToggleOptions(savedAppState);
          if (savedAppState.code) {
            pyInputSetValue(savedAppState.code);
            if (savedAppState.mode === 'display') {
              _savedCurInstr = savedAppState.curInstr; // #crufty
              mixLazyExecuteCode();
            }
          }

          if (savedAppState.testCasesJSON) {
            var testCasesLst = JSON.parse(savedAppState.testCasesJSON);
            $("#createTestsLink").hide();
            initTestcasesPane('#testCasesPane', saveCurrentConfiguration);
            testCasesLst.forEach(function(e) {
              addTestcase(e, saveCurrentConfiguration);
            });
          }

          if (savedAppState.mode === 'edit') {
            enterOPTEditCodeMode();
          }
        }
      });

      // set configuration on every code edit and option toggle, to
      // set the 'dirty bit' on the enclosing PPT file
      pyInputAceEditor.getSession().on("change", saveCurrentConfiguration);
      $('select').change(saveCurrentConfiguration);
    }
  });
}

function saveCurrentConfiguration() {
  if (_labEditor) {
    var x = getAppStateWithTraceCache();
    // propagate cachedTrace only if x doesn't already have one
    // i.e., don't clobber the new cachedTrace if it exists
    if (x.cachedTrace === undefined &&
        _lastSavedAppState && _lastSavedAppState.cachedTrace) {
      x.cachedTrace = _lastSavedAppState.cachedTrace;
      x.cachedCod = _lastSavedAppState.cachedCod; // rtrim() already applied
      x.cachedLang = _lastSavedAppState.cachedLang;
    }
    //console.log('saveCurrentConfiguration', x);
    _labEditor.setConfiguration(getConfigurationFromData(x),
                                function() {} /* empty error handler */);
    _lastSavedAppState = x; // global!
  }
}


function mixLazyExecuteCode() {
  var curState = getAppState();
  var curCod = curState.code.rtrim(); // rtrim to match cachedCod
  var curLang = curState.py;

  // ugh legacy naming mismatches:
  if (curLang === '2') {
    curLang = 'py2';
  } else if (curLang === '3') {
    curLang = 'py3';
  }

  if (_lastSavedAppState &&
      curCod === _lastSavedAppState.cachedCod &&
      curLang === _lastSavedAppState.cachedLang) {
    // cache hit!
    console.log('mixLazyExecuteCode CACHE HIT!');

    // copy-pasta from excerpts of executeCodeFromScratch and friends:

    // if you're in display mode, kick back into edit mode before
    // executing or else the display might not refresh properly ... ugh
    // krufty FIXME
    enterEditMode();
    clearFrontendError();

    var frontendOptionsObj = {embeddedMode: true,
                              executeCodeWithRawInputFunc: executeCodeWithRawInput,
                              lang: _lastSavedAppState.cachedLang, // important!
                             };
    myVisualizer = new ExecutionVisualizer('pyOutputPane',
                                           {code: _lastSavedAppState.cachedCod,
                                            trace: _lastSavedAppState.cachedTrace},
                                           frontendOptionsObj);

    officeMixFinishSuccessfulExecution();
  } else {
    // cache miss
    executeCodeFromScratch(); // ends with officeMixFinishSuccessfulExecution or handleUncaughtExceptionFunc
  }
}


// for opt-testcases.js
function getBaseBackendOptionsObj() {
  var ret = {cumulative_mode: false,
             heap_primitives: false,
             show_only_outputs: false,
             py_crazy_mode: false,
             origin: originFrontendJsFile};
  return ret;
}

function getBaseFrontendOptionsObj() {
  ret = {embeddedMode: true};
  return ret;
}


$(document).ready(function() {
  $('#pythonVersionSelector').change(setAceMode);

  $("#executeBtn").click(function() {
    mixLazyExecuteCode();
  });

  $("#createTestsLink").click(function() {
    initTestcasesPane('#testCasesPane', saveCurrentConfiguration);
    $(this).hide();
    return false;
  });

  // To run in https://labsjs.blob.core.windows.net/sdk/LabsJS-1.0.4/labshost.html
  // append "?PostMessageLabHost" to the query string.
  Labs.DefaultHostBuilder = function() {
    if (window.location.href.indexOf("PostMessageLabHost") !== -1) {
      return new Labs.PostMessageLabHost("test", parent, "*");
    } else {
      return new Labs.OfficeJSLabHost();
    }
  };

  // still needed to track and trigger appMode changes
  $(window).bind("hashchange", function(e) {
    // if you've got some preseeded code, then parse the entire query
    // string from scratch just like a page reload
    if ($.bbq.getState('code')) {
      parseQueryString();
    }
    // otherwise just do an incremental update
    else {
      var newMode = $.bbq.getState('mode');
      //console.log('hashchange:', newMode, window.location.hash);
      updateAppDisplay(newMode);
    }
  });

  // TODO: in the future, make it flexible height but for now, just make
  // it fixed-height but kinda small-ish
  initAceEditor(200);
  pyInputAceEditor.setOptions({minLines: 10, maxLines: 1000});

  // no frills footer
  $("#footer").css("margin-top", "0px")
              .css("padding-top", "0px")
              .css("border-top", "0px");

  $(window).resize(redrawConnectors);

  // register a generic AJAX error handler
  $(document).ajaxError(function(evt, jqxhr, settings, exception) {
    setFronendError(["Server error! Your code might be taking too much time to run or using too much memory.",
                     "Report a bug to philip@pgbovine.net by clicking the 'Generate permanent link' button",
                     "at the bottom of this page and including a URL in your email."]);

    doneExecutingCode();
  });

  clearFrontendError();


  Labs.connect(function (err, connectionResponse) {
    var initialMode = Labs.Core.LabMode[connectionResponse.mode];

    if (initialMode == 'Edit') {
      officeMixEnterEditMode();
      enterOPTEditCodeMode(); // do this once initially
    } else if (initialMode == 'View') {
      officeMixEnterViewMode();
    }

    // initialize these callbacks only after Labs.connect is successful
    Labs.on(Labs.Core.EventTypes.ModeChanged, function(data) {
      if (data.mode == 'Edit') {
        officeMixEnterEditMode();
      } else if (data.mode == 'View') {
        officeMixEnterViewMode();
      }
    });

    Labs.on(Labs.Core.EventTypes.Activate, function() {
    });

    Labs.on(Labs.Core.EventTypes.Deactivate, function() {
    });
  });
});
