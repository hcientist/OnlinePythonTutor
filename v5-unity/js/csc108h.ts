// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

// customized version of opt-frontend.js for ../csc108h.html

import {OptFrontendSharedSessions} from './opt-shared-sessions';
import {assert,htmlspecialchars} from './pytutor';
import {footerHtml} from './footer-html';

export class OptFrontendCsc108h extends OptFrontendSharedSessions {
  constructor(params={}) {
    (params as any).disableLocalStorageToggles = true;
    super(params);
    this.originFrontendJsFile = 'csc108h.js';
  }

  getBaseBackendOptionsObj() {
    var ret = {cumulative_mode: false,
               heap_primitives: true,
               show_only_outputs: false,
               origin: this.originFrontendJsFile};
    return ret;
  }

  getBaseFrontendOptionsObj() {
    var ret = { disableHeapNesting: true, // render all objects on the heap
                drawParentPointers: true, // show environment parent pointers
                textualMemoryLabels: true, // use text labels for references

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

} // END Class OptFrontendCsc108h

$(document).ready(function() {
  $("#footer").append(footerHtml); // initialize all HTML before creating OptFrontend object
  var optFrontend = new OptFrontendCsc108h();
  optFrontend.setSurveyHTML();
});
