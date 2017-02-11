// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

// customized version of opt-frontend.js for ../composingprograms.html

import {OptFrontendSharedSessions} from './opt-shared-sessions';
import {assert,htmlspecialchars} from './pytutor';
import {footerHtml} from './footer-html';

export class OptFrontendComposingprograms extends OptFrontendSharedSessions {
  constructor(params={}) {
    (params as any).disableLocalStorageToggles = true;
    super(params);
    this.originFrontendJsFile = 'composingprograms.js';
  }

  getBaseBackendOptionsObj() {
    var ret = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
               heap_primitives: false,
               show_only_outputs: false,
               origin: this.originFrontendJsFile};
    return ret;
  }

  getBaseFrontendOptionsObj() {
    var ret = { compactFuncLabels: true,
                showAllFrameLabels: true,

                disableHeapNesting: false,
                textualMemoryLabels: false,

                executeCodeWithRawInputFunc: this.executeCodeWithRawInput.bind(this),
                updateOutputCallback: function() {$('#urlOutput,#urlOutputShortened,#embedCodeOutput').val('');},
                startingInstruction: 0,

                // always use the same visualizer ID for all
                // instantiated ExecutionVisualizer objects,
                // so that they can sync properly across
                // multiple clients using TogetherJS in shared sessions.
                // this shouldn't lead to problems since only ONE
                // ExecutionVisualizer will be shown at a time
                visualizerIdOverride: '1',
              };
    return ret;
  }

} // END Class OptFrontendComposingprograms

$(document).ready(function() {
  $("#footer").append(footerHtml); // initialize all HTML before creating OptFrontend object
  var optFrontend = new OptFrontendComposingprograms();
  optFrontend.setSurveyHTML();
});
