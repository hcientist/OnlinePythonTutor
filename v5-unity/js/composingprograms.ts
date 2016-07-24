// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

import {OptFrontend} from './opt-frontend.ts';
import {OptFrontendSharedSessions,TogetherJS} from './opt-shared-sessions.ts';
import {assert,htmlspecialchars} from './pytutor.ts';
import {footerHtml} from './footer-html.ts';

// for TypeScript
declare var initCodeopticon: any; // FIX later when porting Codeopticon
declare var codeopticonUsername: string; // FIX later when porting Codeopticon
declare var codeopticonSession: string;  // FIX later when porting Codeopticon


var optFrontend: OptFrontend;


// augment with a "Create test cases" pane
export class OptFrontendComposingprograms extends OptFrontendSharedSessions {
  constructor(params={}) {
    super(params);
    this.originFrontendJsFile = 'composingprograms.js';
  }

} // END Class OptFrontendComposingprograms


$(document).ready(function() {
  // initialize all HTML elements before creating optFrontend object
  $("#footer").append(footerHtml);

  optFrontend = new OptFrontendComposingprograms();
  optFrontend.setSurveyHTML();

  $('#pythonVersionSelector').change(optFrontend.setAceMode.bind(optFrontend));
  optFrontend.setAceMode();
});
