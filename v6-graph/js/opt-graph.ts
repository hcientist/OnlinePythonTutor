require('../css/opt-frontend.css');
require('../css/graph-visualizer.css');

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
    $('#codeInputPane').css('width', '600px');
    $("#footer").append(privacyAndEndingHTML);
}

setReadMode(){
   this.pyInputAceEditor.setReadOnly(true);
}
}




$(document).ready(function() {
    optGraphFrontend = new OptGraphFrontend({});
    var zoom = 1;
    var zoomStep = 0.2;

    var fcg = 'This graph represents calling relationships between functions. The blue nodes represent the functions defined by the user while the green ones the functions pre-defined.';
    var cfg = "A control-flow graph (CFG) is a representation of all paths that might be traversed through a program during its execution.";
    var dfg = "This graph represents data dependencies between variables. The green nodes represents a final state variable after an operation/value assignment. The red ones indicates this variable can have one of the previous states.";
    document.getElementById('info').innerHTML = fcg;

    $( "#graphSelector" ).change(function() {
       var selectorVal = $('#graphSelector').val();
       if (selectorVal === "FCG") {
           $("#functionSelector").hide();
           document.getElementById('info').innerHTML = fcg;
       }
       else if (selectorVal === "CFG") {
           $("#functionSelector").show();
           document.getElementById('info').innerHTML = cfg;
       }
       else {
           $("#functionSelector").show();
           document.getElementById('info').innerHTML = dfg;
       }
     });

    $("#imageid").click(function(){
        document.getElementById('modal').style.display='block';
    });

    $("#close").click(function(){
        zoom = 1
        document.getElementById("modalimg").style.transform = "scale("+zoom+")";
        document.getElementById('modal').style.display='none';
    });

    $("#zoom-in").click(function(){
      zoom += zoomStep;
      document.getElementById("modalimg").style.transform = "scale("+zoom+")";
     });

    $("#zoom-out").click(function(){
        if(zoom > zoomStep){
            zoom -= zoomStep;
            document.getElementById("modalimg").style.transform = "scale("+zoom+")";
        }
    });

    $("#graphBtn").click(function() {
        var selectorVal = $('#graphSelector').val();
        var funct :string = "";
        if (selectorVal != "FCG")
            funct = $("#functionSelector").val();
        var path = "";
        $.get("/viz_graph.py", {code: code, graph: selectorVal, func: funct} , function(data){
            path = data;
            document.getElementById("imageid").setAttribute('src',data);
            document.getElementById("modalimg").setAttribute('src',data);
            setTimeout(() => {
                $.get("/del_img.py", {path: path});
            }, 5000);
        });
    });

});