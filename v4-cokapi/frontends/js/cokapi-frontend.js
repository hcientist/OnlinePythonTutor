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


// copied and stripped down from opt-frontend.js


// TODO: combine and minify with https://github.com/mishoo/UglifyJS2
// and add version numbering using a ?-style query string to prevent
// caching snafus


// Pre-reqs:
// - pytutor.js
// - jquery.ba-bbq.min.js
// - jquery.ba-dotimeout.min.js // for event debouncing: http://benalman.com/code/projects/jquery-dotimeout/examples/debouncing/
// - opt-frontend-common.js
// - js/togetherjs/togetherjs-min.js
// should all be imported BEFORE this file


var originFrontendJsFile = 'cokapi.js';

function executeCode(forceStartingInstr, forceRawInputLst) {
  var isJsMode = ($('#pythonVersionSelector').val() === 'js');
  if (forceRawInputLst !== undefined) {
    rawInputLst = forceRawInputLst; // UGLY global across modules, FIXME
  }

  var backend_script = null;
  if ($('#pythonVersionSelector').val() === '2') {
      backend_script = '/exec_py2';
  }
  else if ($('#pythonVersionSelector').val() === '3') {
      backend_script = '/exec_py3'
  }
  else if (isJsMode) {
      backend_script = '/exec_js';
  }
  else {
    alert("Invalid version selector");
    assert(false);
  }

  // for now, don't enable any custom options when rendering JS

  var backendOptionsObj = {cumulative_mode: (isJsMode ? false : ($('#cumulativeModeSelector').val() == 'true')),
                           heap_primitives: (isJsMode ? false : ($('#heapPrimitivesSelector').val() == 'true')),
                           show_only_outputs: (isJsMode ? false : ($('#showOnlyOutputsSelector').val() == 'true')),
                           origin: originFrontendJsFile};

  var startingInstruction = forceStartingInstr ? forceStartingInstr : 0;

  var frontendOptionsObj = {startingInstruction: startingInstruction,
                            // tricky: selector 'true' and 'false' values are strings!
                            disableHeapNesting: (isJsMode ? false : ($('#heapPrimitivesSelector').val() == 'true')),
                            drawParentPointers: (isJsMode ? false : ($('#drawParentPointerSelector').val() == 'true')),
                            textualMemoryLabels: (isJsMode ? false : ($('#textualMemoryLabelsSelector').val() == 'true')),
                            showOnlyOutputs: (isJsMode ? false : ($('#showOnlyOutputsSelector').val() == 'true')),
                            executeCodeWithRawInputFunc: executeCodeWithRawInput,
                            lang: (isJsMode ? 'js' : undefined),

                            // always use the same visualizer ID for all
                            // instantiated ExecutionVisualizer objects,
                            // so that they can sync properly across
                            // multiple clients using TogetherJS. this
                            // shouldn't lead to problems since only ONE
                            // ExecutionVisualizer will be shown at a time
                            visualizerIdOverride: '1',
                            updateOutputCallback: function() {$('#urlOutput,#embedCodeOutput').val('');},
                           }

  executeUserCode(pyInputGetValue(),
                  backend_script, backendOptionsObj,
                  frontendOptionsObj,
                  'pyOutputPane',
                  optFinishSuccessfulExecution, handleUncaughtExceptionFunc);
}

function initAceAndOptions() {
  if ($('#pythonVersionSelector').val() === 'js') {
    $('#optionsPane').hide();
  } else {
    $('#optionsPane').show();
  }
  setAceMode(); // update syntax highlighting mode
}


var JS_EXAMPLES = {
  jsFactExLink: 'example-code/javascript/fact.js',
  jsDatatypesExLink: 'example-code/javascript/data-types.js',
  jsExceptionExLink: 'example-code/javascript/caught-exception.js',
  jsClosureExLink: 'example-code/javascript/closure1.js',
  jsShadowingExLink: 'example-code/javascript/var-shadowing2.js',
  jsConstructorExLink: 'example-code/javascript/constructor.js',
  jsInhExLink: 'example-code/javascript/inheritance.js',
};

var PY_EXAMPLES = {
  pyAliasingExLink: 'example-code/python/aliasing.txt',
  pyFactExLink: 'example-code/python/fact.txt',
  pyInputExLink: 'example-code/python/raw_input.txt',
  pyObjExLink: 'example-code/python/oop_1.txt',
  pyInhExLink: 'example-code/python/oop_inherit.txt',
  pyClosureExLink: 'example-code/python/closure2.txt',
  pyForelseExLink: 'example-code/python/for-else.txt',
};

$(document).ready(function() {
  $(".exampleLink").click(function() {
    var myId = $(this).attr('id');
    var exFile;
    if (JS_EXAMPLES[myId] !== undefined) {
      exFile = JS_EXAMPLES[myId];
      $('#pythonVersionSelector').val('js');
    } else {
      assert(PY_EXAMPLES[myId] !== undefined);
      exFile = PY_EXAMPLES[myId];
      $('#pythonVersionSelector').val('2');
    }

    $.get(exFile, function(dat) {
      pyInputSetValue(dat);
      initAceAndOptions();
    });
    return false; // prevent 'a' click from going to an actual link
  });
  $('#pythonVersionSelector').change(initAceAndOptions);

  // feedback
  if (supports_html5_storage()) {
    var v = localStorage.getItem('feedbackName');
    if (v) {
      $("#feedbackName").val(v);
    }
  }

  $("#feedbackName").on('change', function() {
    if (supports_html5_storage()) {
      localStorage.setItem('feedbackName', $(this).val());
    }
  });

  $("#submitFeedbackBtn").click(function() {
    var name = $("#feedbackName").val();
    var txt = $("#feedbackText").val();
    if (!txt.trim()) {
      return;
    }

    // should really be a $.post but i'm lazy and $.get is easier to
    // implement on the server
    $.get('/feedback',
          {name: name ? name : '',
           feedback: txt,
           appStateJSON: JSON.stringify(getAppState())}, function(dat) {

            if (dat === 'ok') {
              alert("Thanks for submitting your feedback!");
            } else if (dat === 'toolong') {
              alert("Error: feedback text is too long.\nPlease shorten and resubmit.");
            } else {
              alert("Unknown error in submitting feedback.\nPlease email philip@pgbovine.net");
            }
          });
  });


  genericOptFrontendReady(); // initialize at the end
  initAceAndOptions(); // do this after genericOptFrontendReady
});
