require('../css/opt-frontend.css');

import {OptFrontend} from './opt-frontend';
import {allTabsRE} from './opt-frontend';
import {privacyAndEndingHTML} from './footer-html';

var optGraphFrontend: OptGraphFrontend;

export class OptGraphFrontend extends OptFrontend {

constructor(params) {
    super(params)
    console.log("teste:\n" +super.pyInputGetValue());
    this.setReadMode()

    $("#footer").append(privacyAndEndingHTML);
}

setReadMode(){
   this.pyInputAceEditor.setReadOnly(true);
}
}

$(document).ready(function() {
  optGraphFrontend = new OptGraphFrontend({});
});