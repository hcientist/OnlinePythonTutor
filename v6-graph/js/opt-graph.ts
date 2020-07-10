require('../css/opt-frontend.css');

import {OptFrontend} from './opt-frontend';
import {allTabsRE} from './opt-frontend';
import {privacyAndEndingHTML} from './footer-html';

var optGraphFrontend: OptGraphFrontend;
var code

export class OptGraphFrontend extends OptFrontend {


constructor(params) {
    super(params)
    this.setReadMode()
    code = this.pyInputGetValue()
    $.get("/viz_function.py", {code: code} , function(data){
                var str=""
                var list = data.split(" ");
                list.forEach(function(fun) {
                    str += "<option value=" + fun + ">"+ fun +"</option>"
                });
                document.getElementById("functionSelector").innerHTML = str;
    });
    $("#functionSelector").hide();


    $("#footer").append(privacyAndEndingHTML);
}

setReadMode(){
   this.pyInputAceEditor.setReadOnly(true);
}
}

$(document).ready(function() {
    optGraphFrontend = new OptGraphFrontend({});

     $( "#graphSelector" ).change(function() {
            var selectorVal = $('#graphSelector').val();
            if (selectorVal === "FCG")
                $("#functionSelector").hide();
            else
                $("#functionSelector").show();
     });


    $("#graphBtn").click(function() {
        var selectorVal = $('#graphSelector').val();
        var funct :string = ""
        if (selectorVal != "FCG")
            funct = $("#functionSelector").val();
        var path = ""
        $.get("/viz_graph.py", {code: code, graph: selectorVal, func: funct} , function(data){
            path = data
            document.getElementById("imageid").setAttribute('src',data);
            $.get("/del_img.py", {path: path});
        })

    });

});