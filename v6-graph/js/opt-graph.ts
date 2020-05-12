require('../css/opt-frontend.css');

import {OptFrontend} from './opt-frontend';
import {allTabsRE} from './opt-frontend';
import {privacyAndEndingHTML} from './footer-html';

var optGraphFrontend: OptGraphFrontend;

export class OptGraphFrontend extends OptFrontend {


constructor(params) {
    super(params)
    console.log("teste:\n" +this.pyInputGetValue());
    this.setReadMode()

    $.get("/viz_graph.py", {code: this.pyInputGetValue()} , function(data){
                var str=""
                var list = data.split(" ");
                list.forEach(function(fun) {
                    str += "<option value=" + fun + ">"+ fun +"</option>"
                });
                document.getElementById("functionSelector").innerHTML = str;
    });
    $("#functionSelector").hide();

    $( "#graphSelector" ).change(function() {
        var selectorVal = $('#graphSelector').val();
        if (selectorVal === "FCG")
            $("#functionSelector").hide();
        else
            $("#functionSelector").show();
        });

    $("#footer").append(privacyAndEndingHTML);
}

changeValue() {
    console.log("ahahah");
    var selectorVal = $('#graphSelector').val();
    if (selectorVal === "FCG")
        $("#functionSelector").hide();
    else
        $("#functionSelector").show();


}


setReadMode(){
   this.pyInputAceEditor.setReadOnly(true);
}
}

$(document).ready(function() {
  optGraphFrontend = new OptGraphFrontend({});
});