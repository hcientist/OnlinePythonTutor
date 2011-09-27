// jsPlumb demo for Online Python Tutor 2.0

var lightGray = "#dddddd";
var darkBlue = "#3D58A2";
var pinkish = "#F15149";

function initJsPlumb() {
	//console.log("initJsPlumb()");

	// set some sensible defaults
	jsPlumb.Defaults.Endpoint = ["Dot", {radius:3}];
	//jsPlumb.Defaults.Endpoint = ["Rectangle", {width:3, height:3}];
	jsPlumb.Defaults.EndpointStyle = {fillStyle: lightGray};
	jsPlumb.Defaults.Anchors = ["RightMiddle", "LeftMiddle"];
	jsPlumb.Defaults.Connector = [ "Bezier", { curviness:15 }]; /* too much 'curviness' causes lines to run together */
  jsPlumb.Defaults.PaintStyle = {lineWidth:1, strokeStyle: lightGray};

	jsPlumb.Defaults.EndpointHoverStyle = {fillStyle: pinkish};
	jsPlumb.Defaults.HoverPaintStyle = {lineWidth:2, strokeStyle: pinkish};

	// make some example connections
  jsPlumb.connect({source:"global_TowerOfHanoi", target:"heap_func1"});
  jsPlumb.connect({source:"global_stack1", target:"heap_list2"});
  jsPlumb.connect({source:"global_stack2", target:"heap_list3"});
  jsPlumb.connect({source:"global_stack3", target:"heap_list4"});

  jsPlumb.connect({source:"TowerOfHanoi5_a", target:"heap_list2"});
  jsPlumb.connect({source:"TowerOfHanoi5_b", target:"heap_list4"});
  jsPlumb.connect({source:"TowerOfHanoi5_tmp", target:"heap_list3"});

  jsPlumb.connect({source:"TowerOfHanoi4_a", target:"heap_list2"});
  jsPlumb.connect({source:"TowerOfHanoi4_b", target:"heap_list3"});
  jsPlumb.connect({source:"TowerOfHanoi4_tmp", target:"heap_list4"});

  jsPlumb.connect({source:"TowerOfHanoi3_a", target:"heap_list4"});
  jsPlumb.connect({source:"TowerOfHanoi3_b", target:"heap_list3"});
  jsPlumb.connect({source:"TowerOfHanoi3_tmp", target:"heap_list2"});

  jsPlumb.connect({source:"TowerOfHanoi2_a", target:"heap_list4"});
  jsPlumb.connect({source:"TowerOfHanoi2_b", target:"heap_list2"});
  jsPlumb.connect({source:"TowerOfHanoi2_tmp", target:"heap_list3"});

  jsPlumb.connect({source:"TowerOfHanoi1_a", target:"heap_list3"});
  jsPlumb.connect({source:"TowerOfHanoi1_b", target:"heap_list2"});
  jsPlumb.connect({source:"TowerOfHanoi1_tmp", target:"heap_list4"});


	$(".stackFrameHeader").click(function() {
		var enclosingStackFrame = $(this).parent();
		var enclosingStackFrameID = enclosingStackFrame.attr('id');

		var allConnections = jsPlumb.getConnections();
		for (var i = 0; i < allConnections.length; i++) {
			var c = allConnections[i];

			// this is VERY VERY fragile code, since it assumes that going up
			// five layers of parent() calls will get you from the source end
			// of the connector to the enclosing stack frame
			var stackFrameDiv = c.source.parent().parent().parent().parent().parent();

			// if this connector starts in the selected stack frame ...
			if (stackFrameDiv.attr('id') == enclosingStackFrameID) {
				// then HIGHLIGHT IT!
        c.setPaintStyle({lineWidth:2, strokeStyle: darkBlue});
        c.endpoints[0].setPaintStyle({fillStyle: darkBlue});
        //c.endpoints[1].setPaintStyle({fillStyle: darkBlue});
        c.endpoints[1].setVisible(false, true, true); // JUST set right endpoint to be invisible

				// ... and move it to the VERY FRONT
				$(c.canvas).css("z-index", 1000);
			}
			else {
				// else unhighlight it
        c.setPaintStyle({lineWidth:1, strokeStyle: lightGray});
        c.endpoints[0].setPaintStyle({fillStyle: lightGray});
        //c.endpoints[1].setPaintStyle({fillStyle: lightGray});
        c.endpoints[1].setVisible(false, true, true); // JUST set right endpoint to be invisible

				$(c.canvas).css("z-index", 0);
			}
		}

		// clear everything, then just activate $(this) one ...
		$(".stackFrame").removeClass("selectedStackFrame");
		$(".stackFrameHeader").addClass("inactiveStackFrameHeader");

		enclosingStackFrame.addClass("selectedStackFrame");
		$(this).removeClass("inactiveStackFrameHeader");
	});

	// 'click' on the top-most stack frame
	$('#toh1_header').trigger('click');

}

$(document).ready(function() {
	// HACK:add a delay so that plumbs render properly AFTER all elements are loaded
	window.setTimeout(initJsPlumb, 150);
});

