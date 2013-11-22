// look at js/pytutor.js for guide on refactoring object methods in JS!
function HolisticVisualizer(domRootID, dat, params) {

	var myViz = this;
	myViz.domRoot = $('#' + domRootID);
	myViz.domRootD3 = d3.select('#' + domRootID);

	myViz.domRoot.html('<div class="HolisticVisualizer"></div>');
	myViz.domRoot = myViz.domRoot.find('div.HolisticVisualizer');
	myViz.domRootD3 = myViz.domRootD3.select('div.HolisticVisualizer');

	var pregeneratedHTML = '<div class="control">\
	            <form action="">\
	                <label for="viewmode">View Mode:</label>\
	                <select id="var-select" class="dropdown" name="viewmode">\
	                    <option value="default">Default</option>\
	                </select>\
	                <br>\
	                <input id="connector-select" type="checkbox" name="connector" value="Connectors" checked>Connecting line\
	                <br>\
	                <input id="debug-select" type="checkbox" name="debug" value="debug">Debug panel\
	                <br>\
	                <input id="delimiter-select" type="checkbox" name="delimiters" value="delimiters">Function delimiters\
	                <br>\
	            </form>\
	        </div>\
	        <table id="code"></table>\
	        <div id="slider"></div>\
	        <div id="debug-panel">\
	            <h3>Debug: step <span id="debug-title">N/A</span></h3>\
	            <div id="debug">\
	            </div>\
	        </div>';

	myViz.domRoot.html(pregeneratedHTML);

	/*
	 * =================================
	 *              DATASET
	 * =================================
	 */
	// factorial
	// var trace = {"code": "# dumb recursive factorial\ndef fact(n):\n    if (n <= 1):\n        return 1\n    else:\n        return n * fact(n - 1)\n\nprint(fact(6))\n", "trace": [{"ordered_globals": [], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {}, "heap": {}, "line": 2, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 8, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 2, "event": "call"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 3, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 6, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 2, "event": "call"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 3, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 6, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 2, "event": "call"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 3, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 6, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}, {"frame_id": 4, "encoded_locals": {"n": 3}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f4", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 2, "event": "call"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}, {"frame_id": 4, "encoded_locals": {"n": 3}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f4", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 3, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}, {"frame_id": 4, "encoded_locals": {"n": 3}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f4", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 6, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}, {"frame_id": 4, "encoded_locals": {"n": 3}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f4", "ordered_varnames": ["n"]}, {"frame_id": 5, "encoded_locals": {"n": 2}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f5", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 2, "event": "call"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}, {"frame_id": 4, "encoded_locals": {"n": 3}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f4", "ordered_varnames": ["n"]}, {"frame_id": 5, "encoded_locals": {"n": 2}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f5", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 3, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}, {"frame_id": 4, "encoded_locals": {"n": 3}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f4", "ordered_varnames": ["n"]}, {"frame_id": 5, "encoded_locals": {"n": 2}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f5", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 6, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}, {"frame_id": 4, "encoded_locals": {"n": 3}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f4", "ordered_varnames": ["n"]}, {"frame_id": 5, "encoded_locals": {"n": 2}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f5", "ordered_varnames": ["n"]}, {"frame_id": 6, "encoded_locals": {"n": 1}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f6", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 2, "event": "call"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}, {"frame_id": 4, "encoded_locals": {"n": 3}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f4", "ordered_varnames": ["n"]}, {"frame_id": 5, "encoded_locals": {"n": 2}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f5", "ordered_varnames": ["n"]}, {"frame_id": 6, "encoded_locals": {"n": 1}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f6", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 3, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}, {"frame_id": 4, "encoded_locals": {"n": 3}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f4", "ordered_varnames": ["n"]}, {"frame_id": 5, "encoded_locals": {"n": 2}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f5", "ordered_varnames": ["n"]}, {"frame_id": 6, "encoded_locals": {"n": 1}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f6", "ordered_varnames": ["n"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 4, "event": "step_line"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}, {"frame_id": 4, "encoded_locals": {"n": 3}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f4", "ordered_varnames": ["n"]}, {"frame_id": 5, "encoded_locals": {"n": 2}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f5", "ordered_varnames": ["n"]}, {"frame_id": 6, "encoded_locals": {"__return__": 1, "n": 1}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f6", "ordered_varnames": ["n", "__return__"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 4, "event": "return"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}, {"frame_id": 4, "encoded_locals": {"n": 3}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f4", "ordered_varnames": ["n"]}, {"frame_id": 5, "encoded_locals": {"__return__": 2, "n": 2}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f5", "ordered_varnames": ["n", "__return__"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 6, "event": "return"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"n": 4}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n"]}, {"frame_id": 4, "encoded_locals": {"__return__": 6, "n": 3}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f4", "ordered_varnames": ["n", "__return__"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 6, "event": "return"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"n": 5}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n"]}, {"frame_id": 3, "encoded_locals": {"__return__": 24, "n": 4}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f3", "ordered_varnames": ["n", "__return__"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 6, "event": "return"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"n": 6}, "is_highlighted": false, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n"]}, {"frame_id": 2, "encoded_locals": {"__return__": 120, "n": 5}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f2", "ordered_varnames": ["n", "__return__"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 6, "event": "return"}, {"ordered_globals": ["fact"], "stdout": "", "func_name": "fact", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"__return__": 720, "n": 6}, "is_highlighted": true, "is_parent": false, "func_name": "fact", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "fact_f1", "ordered_varnames": ["n", "__return__"]}], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 6, "event": "return"}, {"ordered_globals": ["fact"], "stdout": "720\n", "func_name": "<module>", "stack_to_render": [], "globals": {"fact": ["REF", 1]}, "heap": {"1": ["FUNCTION", "fact(n)", null]}, "line": 8, "event": "return"}]};
	// an example with lists (hello from opt)
	// var trace = {"code": "x = [1, 2, 3]\ny = [4, 5, 6]\nz = y\ny = x\nx = z\n\nx = [1, 2, 3] # a different [1, 2, 3] list!\ny = x\nx.append(4)\ny.append(5)\nz = [1, 2, 3, 4, 5] # a different list!\nx.append(6)\ny.append(7)\ny = \"hello\"\n\n\ndef foo(lst):\n    lst.append(\"hello\")\n    bar(lst)\n\ndef bar(myLst):\n    print(myLst)\n\nfoo(x)\nfoo(z)\n", "trace": [{"ordered_globals": [], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {}, "heap": {}, "line": 1, "event": "step_line"}, {"ordered_globals": ["x"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"x": ["REF", 1]}, "heap": {"1": ["LIST", 1, 2, 3]}, "line": 2, "event": "step_line"}, {"ordered_globals": ["x", "y"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": ["REF", 2], "x": ["REF", 1]}, "heap": {"1": ["LIST", 1, 2, 3], "2": ["LIST", 4, 5, 6]}, "line": 3, "event": "step_line"}, {"ordered_globals": ["x", "y", "z"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": ["REF", 2], "x": ["REF", 1], "z": ["REF", 2]}, "heap": {"1": ["LIST", 1, 2, 3], "2": ["LIST", 4, 5, 6]}, "line": 4, "event": "step_line"}, {"ordered_globals": ["x", "y", "z"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": ["REF", 1], "x": ["REF", 1], "z": ["REF", 2]}, "heap": {"1": ["LIST", 1, 2, 3], "2": ["LIST", 4, 5, 6]}, "line": 5, "event": "step_line"}, {"ordered_globals": ["x", "y", "z"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": ["REF", 1], "x": ["REF", 2], "z": ["REF", 2]}, "heap": {"1": ["LIST", 1, 2, 3], "2": ["LIST", 4, 5, 6]}, "line": 7, "event": "step_line"}, {"ordered_globals": ["x", "y", "z"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": ["REF", 1], "x": ["REF", 3], "z": ["REF", 2]}, "heap": {"1": ["LIST", 1, 2, 3], "2": ["LIST", 4, 5, 6], "3": ["LIST", 1, 2, 3]}, "line": 8, "event": "step_line"}, {"ordered_globals": ["x", "y", "z"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": ["REF", 3], "x": ["REF", 3], "z": ["REF", 2]}, "heap": {"2": ["LIST", 4, 5, 6], "3": ["LIST", 1, 2, 3]}, "line": 9, "event": "step_line"}, {"ordered_globals": ["x", "y", "z"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": ["REF", 3], "x": ["REF", 3], "z": ["REF", 2]}, "heap": {"2": ["LIST", 4, 5, 6], "3": ["LIST", 1, 2, 3, 4]}, "line": 10, "event": "step_line"}, {"ordered_globals": ["x", "y", "z"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": ["REF", 3], "x": ["REF", 3], "z": ["REF", 2]}, "heap": {"2": ["LIST", 4, 5, 6], "3": ["LIST", 1, 2, 3, 4, 5]}, "line": 11, "event": "step_line"}, {"ordered_globals": ["x", "y", "z"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": ["REF", 3], "x": ["REF", 3], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5], "4": ["LIST", 1, 2, 3, 4, 5]}, "line": 12, "event": "step_line"}, {"ordered_globals": ["x", "y", "z"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": ["REF", 3], "x": ["REF", 3], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6], "4": ["LIST", 1, 2, 3, 4, 5]}, "line": 13, "event": "step_line"}, {"ordered_globals": ["x", "y", "z"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": ["REF", 3], "x": ["REF", 3], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7], "4": ["LIST", 1, 2, 3, 4, 5]}, "line": 14, "event": "step_line"}, {"ordered_globals": ["x", "y", "z"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": "hello", "x": ["REF", 3], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7], "4": ["LIST", 1, 2, 3, 4, 5]}, "line": 17, "event": "step_line"}, {"ordered_globals": ["x", "y", "z", "foo"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7], "4": ["LIST", 1, 2, 3, 4, 5], "5": ["FUNCTION", "foo(lst)", null]}, "line": 21, "event": "step_line"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7], "4": ["LIST", 1, 2, 3, 4, 5], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 24, "event": "step_line"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "", "func_name": "foo", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"lst": ["REF", 3]}, "is_highlighted": true, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f1", "ordered_varnames": ["lst"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7], "4": ["LIST", 1, 2, 3, 4, 5], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 17, "event": "call"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "", "func_name": "foo", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"lst": ["REF", 3]}, "is_highlighted": true, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f1", "ordered_varnames": ["lst"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7], "4": ["LIST", 1, 2, 3, 4, 5], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 18, "event": "step_line"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "", "func_name": "foo", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"lst": ["REF", 3]}, "is_highlighted": true, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f1", "ordered_varnames": ["lst"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 19, "event": "step_line"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "", "func_name": "bar", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"lst": ["REF", 3]}, "is_highlighted": false, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f1", "ordered_varnames": ["lst"]}, {"frame_id": 2, "encoded_locals": {"myLst": ["REF", 3]}, "is_highlighted": true, "is_parent": false, "func_name": "bar", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "bar_f2", "ordered_varnames": ["myLst"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 21, "event": "call"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "", "func_name": "bar", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"lst": ["REF", 3]}, "is_highlighted": false, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f1", "ordered_varnames": ["lst"]}, {"frame_id": 2, "encoded_locals": {"myLst": ["REF", 3]}, "is_highlighted": true, "is_parent": false, "func_name": "bar", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "bar_f2", "ordered_varnames": ["myLst"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 22, "event": "step_line"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "[1, 2, 3, 4, 5, 6, 7, 'hello']\n", "func_name": "bar", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"lst": ["REF", 3]}, "is_highlighted": false, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f1", "ordered_varnames": ["lst"]}, {"frame_id": 2, "encoded_locals": {"__return__": null, "myLst": ["REF", 3]}, "is_highlighted": true, "is_parent": false, "func_name": "bar", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "bar_f2", "ordered_varnames": ["myLst", "__return__"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 22, "event": "return"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "[1, 2, 3, 4, 5, 6, 7, 'hello']\n", "func_name": "foo", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"__return__": null, "lst": ["REF", 3]}, "is_highlighted": true, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f1", "ordered_varnames": ["lst", "__return__"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 19, "event": "return"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "[1, 2, 3, 4, 5, 6, 7, 'hello']\n", "func_name": "<module>", "stack_to_render": [], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 25, "event": "step_line"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "[1, 2, 3, 4, 5, 6, 7, 'hello']\n", "func_name": "foo", "stack_to_render": [{"frame_id": 3, "encoded_locals": {"lst": ["REF", 4]}, "is_highlighted": true, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f3", "ordered_varnames": ["lst"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 17, "event": "call"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "[1, 2, 3, 4, 5, 6, 7, 'hello']\n", "func_name": "foo", "stack_to_render": [{"frame_id": 3, "encoded_locals": {"lst": ["REF", 4]}, "is_highlighted": true, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f3", "ordered_varnames": ["lst"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 18, "event": "step_line"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "[1, 2, 3, 4, 5, 6, 7, 'hello']\n", "func_name": "foo", "stack_to_render": [{"frame_id": 3, "encoded_locals": {"lst": ["REF", 4]}, "is_highlighted": true, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f3", "ordered_varnames": ["lst"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5, "hello"], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 19, "event": "step_line"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "[1, 2, 3, 4, 5, 6, 7, 'hello']\n", "func_name": "bar", "stack_to_render": [{"frame_id": 3, "encoded_locals": {"lst": ["REF", 4]}, "is_highlighted": false, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f3", "ordered_varnames": ["lst"]}, {"frame_id": 4, "encoded_locals": {"myLst": ["REF", 4]}, "is_highlighted": true, "is_parent": false, "func_name": "bar", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "bar_f4", "ordered_varnames": ["myLst"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5, "hello"], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 21, "event": "call"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "[1, 2, 3, 4, 5, 6, 7, 'hello']\n", "func_name": "bar", "stack_to_render": [{"frame_id": 3, "encoded_locals": {"lst": ["REF", 4]}, "is_highlighted": false, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f3", "ordered_varnames": ["lst"]}, {"frame_id": 4, "encoded_locals": {"myLst": ["REF", 4]}, "is_highlighted": true, "is_parent": false, "func_name": "bar", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "bar_f4", "ordered_varnames": ["myLst"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5, "hello"], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 22, "event": "step_line"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "[1, 2, 3, 4, 5, 6, 7, 'hello']\n[1, 2, 3, 4, 5, 'hello']\n", "func_name": "bar", "stack_to_render": [{"frame_id": 3, "encoded_locals": {"lst": ["REF", 4]}, "is_highlighted": false, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f3", "ordered_varnames": ["lst"]}, {"frame_id": 4, "encoded_locals": {"__return__": null, "myLst": ["REF", 4]}, "is_highlighted": true, "is_parent": false, "func_name": "bar", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "bar_f4", "ordered_varnames": ["myLst", "__return__"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5, "hello"], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 22, "event": "return"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "[1, 2, 3, 4, 5, 6, 7, 'hello']\n[1, 2, 3, 4, 5, 'hello']\n", "func_name": "foo", "stack_to_render": [{"frame_id": 3, "encoded_locals": {"__return__": null, "lst": ["REF", 4]}, "is_highlighted": true, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f3", "ordered_varnames": ["lst", "__return__"]}], "globals": {"y": "hello", "x": ["REF", 3], "foo": ["REF", 5], "bar": ["REF", 6], "z": ["REF", 4]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5, "hello"], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 19, "event": "return"}, {"ordered_globals": ["x", "y", "z", "foo", "bar"], "stdout": "[1, 2, 3, 4, 5, 6, 7, 'hello']\n[1, 2, 3, 4, 5, 'hello']\n", "func_name": "<module>", "stack_to_render": [], "globals": {"y": "hello", "x": ["REF", 3], "z": ["REF", 4], "bar": ["REF", 6], "foo": ["REF", 5]}, "heap": {"3": ["LIST", 1, 2, 3, 4, 5, 6, 7, "hello"], "4": ["LIST", 1, 2, 3, 4, 5, "hello"], "5": ["FUNCTION", "foo(lst)", null], "6": ["FUNCTION", "bar(myLst)", null]}, "line": 25, "event": "return"}]};
	// short example
	// var trace = {"code": "x = 5\ny = float(2)\nz = \"hello\"\n\ndef foo(a):\n    return a\n\nprint foo(x)\n", "trace": [{"ordered_globals": [], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {}, "heap": {}, "line": 1, "event": "step_line"}, {"ordered_globals": ["x"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"x": 5}, "heap": {}, "line": 2, "event": "step_line"}, {"ordered_globals": ["x", "y"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": 2.0, "x": 5}, "heap": {}, "line": 3, "event": "step_line"}, {"ordered_globals": ["x", "y", "z"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": 2.0, "x": 5, "z": "hello"}, "heap": {}, "line": 5, "event": "step_line"}, {"ordered_globals": ["x", "y", "z", "foo"], "stdout": "", "func_name": "<module>", "stack_to_render": [], "globals": {"y": 2.0, "x": 5, "foo": ["REF", 1], "z": "hello"}, "heap": {"1": ["FUNCTION", "foo(a)", null]}, "line": 8, "event": "step_line"}, {"ordered_globals": ["x", "y", "z", "foo"], "stdout": "", "func_name": "foo", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"a": 5}, "is_highlighted": true, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f1", "ordered_varnames": ["a"]}], "globals": {"y": 2.0, "x": 5, "foo": ["REF", 1], "z": "hello"}, "heap": {"1": ["FUNCTION", "foo(a)", null]}, "line": 5, "event": "call"}, {"ordered_globals": ["x", "y", "z", "foo"], "stdout": "", "func_name": "foo", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"a": 5}, "is_highlighted": true, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f1", "ordered_varnames": ["a"]}], "globals": {"y": 2.0, "x": 5, "foo": ["REF", 1], "z": "hello"}, "heap": {"1": ["FUNCTION", "foo(a)", null]}, "line": 6, "event": "step_line"}, {"ordered_globals": ["x", "y", "z", "foo"], "stdout": "", "func_name": "foo", "stack_to_render": [{"frame_id": 1, "encoded_locals": {"a": 5, "__return__": 5}, "is_highlighted": true, "is_parent": false, "func_name": "foo", "is_zombie": false, "parent_frame_id_list": [], "unique_hash": "foo_f1", "ordered_varnames": ["a", "__return__"]}], "globals": {"y": 2.0, "x": 5, "foo": ["REF", 1], "z": "hello"}, "heap": {"1": ["FUNCTION", "foo(a)", null]}, "line": 6, "event": "return"}, {"ordered_globals": ["x", "y", "z", "foo"], "stdout": "5\n", "func_name": "<module>", "stack_to_render": [], "globals": {"y": 2.0, "x": 5, "foo": ["REF", 1], "z": "hello"}, "heap": {"1": ["FUNCTION", "foo(a)", null]}, "line": 8, "event": "return"}]};

	// fact + fib

	var trace = dat;
	// build dataset from trace
	var dataset = [];
	for (var i = 0; i < trace.trace.length; i++) {
		// we want indexing to start at 0 - offset of -1
		dataset.push(trace.trace[i].line - 1);
	}

	/*
	 * =================================
	 *            CONSTANTS
	 * =================================
	 */
	var NO_VALUE = '~';

	var max_value = Math.max.apply(Math, dataset);
	var num_rows = max_value + 1;

	// width and height
	var padding = 17;
	var col_w = 26;
	var col_mid = col_w / 2;
	var row_h = 24;
	var row_mid = 12;
	var w = dataset.length * col_w;
	var h = num_rows * row_h;
	var final_h = h + row_h;

	/*
	 * =================================
	 *            CODE TABLE
	 * =================================
	 */
	var code = trace.code.split('\n');
	var table = myViz.domRoot.find('#code');

	for (var i = 0; i < code.length; i++) {
	    table.append('<tr><td><pre><code>' + code[i] + '</code></pre></td></tr>');
	}

	// adjust width and height of table
	myViz.domRoot.find('table').attr('height',h);
	myViz.domRoot.find('td').attr('height',row_h);
	myViz.domRoot.find('tr').attr('height',row_h);

	/*
	 * =================================
	 *          VAR-SELECT MENU
	 * =================================
	 */
	// globals
	var global_group = document.createElement('optgroup');
	global_group.setAttribute('label', 'Globals');
	var globals = {};
	for (var i = 0; i < trace.trace.length; i++) {
		for (var j = 0; j < trace.trace[i].ordered_globals.length; j++) {
			var x = trace.trace[i].ordered_globals[j];
			if (!(x in globals)) {
				var option = document.createElement('option');
				option.text = option.value = x;
				global_group.appendChild(option, null);
				globals[x] = 1;
			}
		}
	}
	myViz.domRoot.find('#var-select').append(global_group);

	// functions
	var functions = {};
	for (var i = 0; i < trace.trace.length; i++) {
		if (trace.trace[i].func_name != "<module>") {
			var func = trace.trace[i].func_name;
			if (!(func in functions)) {
				var function_group = document.createElement('optgroup');
				function_group.setAttribute('label', trace.trace[i].func_name);
				functions[trace.trace[i].func_name] = 1;
				var function_vars = {};

				var n = trace.trace[i].stack_to_render.length;
				for (var j = 0; j < trace.trace[i].stack_to_render[n-1].ordered_varnames.length; j++) {
					var x = trace.trace[i].stack_to_render[n-1].ordered_varnames[j];
					if (!(x in function_vars) &&
						x != '__return__') {
						var option = document.createElement('option');
						option.text = option.value = x;
						function_group.appendChild(option, null);
						function_vars[x] = 1;
					}
				}
				myViz.domRoot.find('#var-select').append(function_group);
			}
		}
	}

	/*
	 * =================================
	 *         SVG CONSTRUCTION
	 * =================================
	 */
	// construct code trace svg
	var d3image = myViz.domRootD3.select("#slider");
	var svg = d3image.append("svg:svg")
	            	 .attr("width", w)
	            	 .attr("height", final_h);

	// scales            	 
	var xScale = d3.scale.linear()
	                     .domain([0, dataset.length-1])
	                     .range([col_mid, w - col_mid]);
	// xScale(i) = (i * col_w) + col_mid
	var yScale = d3.scale.linear()
	                     .domain([0, max_value])
	                     .range([row_mid, h - row_mid]);
	// yScale(d) = (d * row_h) + row_mid

	/*
	 * =================================
	 *         BACKGROUND GROUP
	 * =================================
	 */
	// var backgroundGroup = svg.append("svg:g");
	// var rows = backgroundGroup.selectAll("rect")
	// 			  .data(d3.range(num_rows + 1))
	// 			  .enter()
	// 			  .append("svg:rect");

	// rows.attr("x", 0)
	// 	.attr("y", function(d, i) {
	//             return (d * row_h);
	//         })
	// 	.attr("width", w)
	// 	.attr("height", row_h)
	// 	.attr("fill", function(d, i) {
	//              if (d % 2 == 0) {
	//           		return "#D5F1F1";
	//              } else {
	//              	return "white";
	//              }
	//         });

	/*
	 * =================================
	 *            TEXT GROUP
	 * =================================
	 */
	var textGroup = svg.append("svg:g");
	var values = textGroup.selectAll("text")
	                .data(dataset)
	                .enter()
	                .append("text");

	values.text(
	        function(d, i) {
	        	var val = myViz.domRoot.find('#var-select').val();
	        	if (val == 'default') {
	        		return NO_VALUE;
	        	}

	        	if (myViz.domRoot.find('#var-select').parent().attr('label') == 'globals') {
		        	if (val in trace.trace[i].globals) {
		        		return trace.trace[i].globals[val];
		        	} else {
		        		return NO_VALUE;
		        	}
		        } else {
		        	var n = trace.trace[i].stack_to_render.length;
		        	if (n > 0 &&
		        		val in trace.trace[i].stack_to_render[n-1].encoded_locals &&
		        		myViz.domRoot.find('#var-select').parent().attr('label') == trace.trace[i].stack_to_render[n-1].func_name) {
		        		return trace.trace[i].stack_to_render[n-1].encoded_locals[val];
		        	} else {
		        		return NO_VALUE;
		        	}	        	
		        }
	        })
	        .attr("x", function(d, i) {
	            return xScale(i) - 4;
	        })
	        .attr("y", function(d, i) {
	            return yScale(d) + 4;
	        })
	        .style("visibility", "hidden");

	/*
	 * =================================
	 *          CONNECTOR GROUP
	 * =================================
	 */
	var connectorGroup = svg.append("svg:g");

	// create a line function that can convert data[] into x and y points
	var line = d3.svg.line()
		.x(function(d,i) { 
			return xScale(i); 
		})
		.y(function(d) { 
			return yScale(d); 
		});

	var connector = connectorGroup.append("svg:path")
						.attr("d", line(dataset))
						.style("visibility", "visible");

	/*
	 * =================================
	 *          DEFAULT GROUP
	 * =================================
	 */
	var defaultGroup = svg.append("svg:g");
	var circles = defaultGroup.selectAll("circle")
	                 .data(dataset)
	                 .enter()
	                 .append("circle");

	circles.attr("cx", function(d, i) {
	            return xScale(i);
	        })
	        .attr("cy", function(d, i) {
	            return yScale(d);
	        })
	        .attr("r", "4")
	        .attr("fill", function(d, i) {
	        	var red = 0 + i*7;
	        	var green = 0;
	        	var blue = 0;
	        	return "rgb(" + red + "," + green + "," + blue + ")";
	        })
	        .style("visibility", "visible");

	/*
	 * =================================
	 *          DELIMITER GROUP
	 * =================================
	 */
	// build function call dataset (need to grab returns as well!)
	var function_call_dataset = [];
	for (var i = 0; i < dataset.length; i++) {
		if (trace.trace[i].event == 'call') {
			function_call_dataset.push([i, dataset[i], 'call']);
		} else if (trace.trace[i].event == 'return') {
			function_call_dataset.push([i, dataset[i], 'return']);
		}
	}

	var delimitingGroup = svg.append("svg:g");
	var delimiters = delimitingGroup.selectAll("line")
						.data(function_call_dataset)
						.enter()
						.append("line");

	delimiters.attr("x1", function(d, i) {
				if (d[2] == 'call') {
	            	return xScale(d[0]) - col_mid;
	            } else {
	            	return xScale(d[0]) + col_mid;
	            }
	        })
	        .attr("y1", function(d, i) {
	            return 0;
	        })        
	        .attr("x2", function(d, i) {
				if (d[2] == 'call') {
	            	return xScale(d[0]) - col_mid;
	            } else {
	            	return xScale(d[0]) + col_mid;
	            }
	        })
	        .attr("y2", function(d, i) {
	            return h;
	        })
	        .style("visibility", "hidden")
	        .classed("delimiter", true);

	/*
	 * =================================
	 *           GUIDE GROUP
	 * =================================
	 */
	var guideGroup = svg.append("svg:g");
	var v_guides = guideGroup.selectAll("line")
	                  .data(dataset)
	                  .enter()
	                  .append("line");

	v_guides.attr("x1", function(d, i) {
	            return xScale(i);
	        })
	        .attr("y1", function(d, i) {
	            return 0;
	        })        
	        .attr("x2", function(d, i) {
	            return xScale(i);
	        })
	        .attr("y2", function(d, i) {
	            return h;
	        })
	        .style("visibility", "hidden")
	        .classed("v-guide", true);

	var v_hovers = guideGroup.selectAll("rect")
	                  .data(dataset)
	                  .enter()
	                  .append("rect");

	v_hovers.attr("x", function(d, i) {
	            return (i * col_w);
	        })
	        .attr("y", function(d, i) {
	            return 0;
	        })        
	        .attr("width", function(d, i) {
	            return col_w;
	        })
	        .attr("height", function(d, i) {
	            return h;
	        })
	        .classed("v-hover", true)
	        .on("mouseover", 
	            function(d, i) {
					var row = table[0].rows[d];
					var cell = row.cells[0];
					myViz.domRoot.find('#code tr:eq(' + d + ') td:first').addClass("v-hover");
	                v_guides.filter(
	                    function(data, index) { 
	                        return index == i; 
	                    })
	                .style("visibility", "visible");
	                circles.filter(
	                    function(data, index) { 
	                        return index == i; 
	                    });
	                //.style("fill", "teal");
	            })
	        .on("mousemove", 
	            function(d, i) {
					var row = table[0].rows[d];
					var cell = row.cells[0];
					myViz.domRoot.find('#code tr:eq(' + d + ') td:first').addClass("v-hover");
	                v_guides.filter(
	                    function(data, index) { 
	                        return index == i; 
	                    })
	                .style("visibility", "visible");
	            })
	        .on("mouseout", 
	            function(d, i) {
					var row = table[0].rows[d];
					var cell = row.cells[0];
					myViz.domRoot.find('#code tr:eq(' + d + ') td:first').removeClass("v-hover");
	                v_guides.filter(
	                    function(data, index) { 
	                        return index == i; 
	                    })
	                .style("visibility", "hidden");
	                circles.filter(
	                    function(data, index) { 
	                        return index == i; 
	                    });
	                //.style("fill", "black");
	            });

	/*
	 * =================================
	 *           AXIS GROUP
	 * =================================
	 */
	var axisGroup = svg.append("svg:g");
	var xAxis = d3.svg.axis()
	                  .scale(xScale)
	                  .orient("bottom")
	                  .ticks(dataset.length);
	axisGroup.attr("class", "axis")
	    .attr("transform", "translate(0," + (final_h - padding) + ")")
	    .call(xAxis);

	/*
	 * =================================
	 *          EVENT HANDLERS
	 * =================================
	 */
	myViz.domRoot.find("#var-select").change(function(e) {
	    if (myViz.domRoot.find("#var-select").val() !== 'default') {
	        circles.style("visibility", "hidden");
	        v_hovers.style("visibility", "hidden");
	        values.style("visibility", "visible");
	        values.text(function(d, i) {
	        	var val = myViz.domRoot.find('#var-select').val();
	        	if (val == 'default') {
	        		return "~";
	        	}
	        	if (myViz.domRoot.find(':selected').parent().attr('label') == 'Globals') {
		        	if (val in trace.trace[i].globals) {
		        		return trace.trace[i].globals[val];
		        	} else {
		        		return "~";
		        	}
		        } else {
		        	var n = trace.trace[i].stack_to_render.length;
		        	if (n > 0 &&
		        		val in trace.trace[i].stack_to_render[n-1].encoded_locals &&
		        		myViz.domRoot.find(':selected').parent().attr('label') == trace.trace[i].stack_to_render[n-1].func_name) {
		        		return trace.trace[i].stack_to_render[n-1].encoded_locals[val];
		        	} else {
		        		return "~";
		        	}	        	
		        }
	        });
	    } else {
	        circles.style("visibility", "visible");
	        v_hovers.style("visibility", "visible");
	        values.style("visibility", "hidden");
	    }
	});

	myViz.domRoot.find('#connector-select').click(function() {
	    if($(this).is(':checked')){
	        connector.style("visibility", "visible");
	    } else {
	        connector.style("visibility", "hidden");
	    }
	});

	myViz.domRoot.find('#debug-panel').hide();
	myViz.domRoot.find('#debug-select').click(function() {
	    if($(this).is(':checked')){
	        myViz.domRoot.find('#debug-panel').show();
	    } else {
	        myViz.domRoot.find('#debug-panel').hide();
	    }
	});

	myViz.domRoot.find('#delimiter-select').click(function() {
	    if($(this).is(':checked')){
	        delimiters.style("visibility", "visible");
	    } else {
	        delimiters.style("visibility", "hidden");
	    }
	});

	var top_position = myViz.domRoot.find('#debug').scrollTop();
	v_hovers.on("click", function (d, i) {
		myViz.domRoot.find('#debug-title').text(i);
		myViz.domRoot.find('#debug').html("<pre>"+JSON.stringify(trace.trace[i], undefined, 2)+"</pre>");
		myViz.domRoot.find('#debug').scrollTop(top_position);
	})
}

// stubs for unimplemented interface methods
HolisticVisualizer.prototype.updateOutput = function() {};
HolisticVisualizer.prototype.redrawConnectors = function() {};
HolisticVisualizer.prototype.destroyAllAnnotationBubbles = function() {};