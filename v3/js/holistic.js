// Created by Irene Chen (2013)

// look at js/pytutor.js for guide on refactoring object methods in JS!
function HolisticVisualizer(domRootID, dat, params) {

	var myViz = this;
	myViz.domRoot = $('#' + domRootID);
	myViz.domRootD3 = d3.select('#' + domRootID);

	myViz.domRoot.html('<div class="HolisticVisualizer"></div>\
		<div id="altContainer"><h3>Step <span id="step-id">N/A</span></h3>\
		<div id="altVisual"></div></div>\
		<div id="holisticTooltip"><b>Step <span id="tooltip-step-id">N/A</span></b>\
		<div id="holisticTooltipVisual"></div></div>');
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
	                <!--<input id="delimiter-select" type="checkbox" name="delimiters" value="delimiters">Function delimiters\
	                <br>-->\
	            </form>\
	        </div>\
	        <div id="wrapper">\
	        <div id="left"><table id="code"></table></div>\
		    <div id="right"><div id="padder"><div id="slider"></div></div></div>\
		    </div>\
	        <div id="debugPanel">\
	            <h3>Debug: step <span id="debug-title">N/A</span></h3>\
	            <div id="debug">\
	            </div>\
	        </div>';

	myViz.domRoot.html(pregeneratedHTML);

	params.hideCode = true;
	myViz.altVisualizer = new ExecutionVisualizer('altVisual', dat, params);
	myViz.tooltipVisualizer = new ExecutionVisualizer('holisticTooltipVisual', dat, params);

	/*
	 * =================================
	 *              DATASET
	 * =================================
	 */

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

	// track alt visual data
	var altVisualStep = 0;

	/*
	 * =================================
	 *            CODE TABLE
	 * =================================
	 */
	var code = trace.code.split('\n');
	var table = myViz.domRoot.find('#code');

	for (var i = 0; i < code.length; i++) {
	    table.append('<tr>' + 
	    	'<td><pre id="code-' + i + '"><code>' + code[i] + '</code></pre></td>' + 
	    	'<td style="text-align:right;"><pre><code>' + (i+1) + ' </code></pre></td>' + 
	    	'</tr>');
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
				if (n > 0) { // pgbovine - added guard

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
			return xScale(d[0]);
		})
		.y(function(d) {
			return yScale(d[1]);
		})
		.interpolate('linear');

	// TODO: this doesn't interpolate the way i want - let's do it manually instead
	var curvedLine = d3.svg.line()
		.x(function(d,i) {
			return xScale(d[0]);
		})
		.y(function(d) {
			return yScale(d[1]);
		})
		.interpolate('basis');

	// tweak path data to include curves
	var straightData = [];
	var callData = [];
	var callTextData = [];
	var returnData = [];

	var specialSegmentsData = [];
	for (var i = 0; i < dataset.length; i++) {
		if (trace.trace[i].event == 'call') {
			if ((i-1) > 0) {
				specialSegmentsData.push([i-1, i, dataset[i], 'call']);
			}
		} else if (trace.trace[i].event == 'return') {
			if ((i+1) < dataset.length) {
				specialSegmentsData.push([i, i+1, dataset[i], 'return']);
			}
		}
	}
	specialSegmentsData.push([dataset.length, dataset.length, dataset[-1], 'end']);

	for (var i = 0; i < specialSegmentsData.length; i++) {
		if (i > 0) {
			var start = specialSegmentsData[i-1][1];
		} else {
			var start = 0;
		}

		// need to include original indices
		var slice = dataset.slice(start,specialSegmentsData[i][1]);
		var sliceData = [];

		for (var j = 0; j < slice.length; j++) {
			sliceData.push([start + j, slice[j]]);
		}

		// push to pathData
		straightData.push(line(sliceData));

		if (specialSegmentsData[i][3] == 'call') {
			var headIndex = specialSegmentsData[i][0];
			var tailIndex = specialSegmentsData[i][1];
			var mid = headIndex;
			var magic = (0.3*dataset[headIndex] + 0.7*dataset[tailIndex]);
			var arrowData = [[headIndex, dataset[headIndex]], [mid, magic], [tailIndex, dataset[tailIndex]]];
			var arrowPathData = "M"+xScale(headIndex)+","+yScale(dataset[headIndex])+
				" Q"+xScale(mid)+","+yScale(magic)+" "+xScale(tailIndex)+","+yScale(dataset[tailIndex]);
			callData.push(arrowPathData);
			callTextData.push([headIndex, dataset[headIndex], tailIndex, dataset[tailIndex]]);
		} else if (specialSegmentsData[i][3] == 'return') {
			var headIndex = specialSegmentsData[i][0];
			var tailIndex = specialSegmentsData[i][1];
			var mid = tailIndex;
			var magic = (0.3*dataset[headIndex] + 0.7*dataset[tailIndex]);
			var arrowData = [[headIndex, dataset[headIndex]], [mid, magic], [tailIndex, dataset[tailIndex]]];
			var arrowPathData = "M"+xScale(headIndex)+","+yScale(dataset[headIndex])+
				" Q"+xScale(mid)+","+yScale(magic)+" "+xScale(tailIndex)+","+yScale(dataset[tailIndex]);
			returnData.push(arrowPathData);
		}
	}

	// arrow head definition

	svg.append("defs").append("marker")
	    .attr("id", "call-arrowhead")
	    .attr("refX", 6 + 3) /*must be smarter way to calculate shift*/
	    .attr("refY", 4)
	    .attr("markerWidth", 10)
	    .attr("markerHeight", 10)
	    .attr("orient", "auto")
	    .append("path")
	    .attr("d", "M 0,0 V 8 L6,4 Z")
	    .style("stroke", "red")
	    .style("fill", "red"); //this is actual shape for arrowhead

	svg.append("defs").append("marker")
	    .attr("id", "return-arrowhead")
	    .attr("refX", 6 + 3) /*must be smarter way to calculate shift*/
	    .attr("refY", 4)
	    .attr("markerWidth", 10)
	    .attr("markerHeight", 10)
	    .attr("orient", "auto")
	    .append("path")
	    .attr("d", "M 0,0 V 8 L6,4 Z")
	    .style("stroke", "lime")
	    .style("fill", "lime"); //this is actual shape for arrowhead

	var straightConnector = connectorGroup.selectAll(".straight")
						.data(straightData)
						.enter()
						.append("svg:path")
						.attr("d", function (d) { return d; })
						.style("visibility", "visible");
	var callConnector = connectorGroup.selectAll(".call")
						.data(callData)
						.enter()
						.append("svg:path")
						.attr("d", function (d) { return d; })
						.style("stroke", "red")
						.style("visibility", "visible")
						.attr("marker-end", "url(#call-arrowhead)");
	var returnConnector = connectorGroup.selectAll(".return")
						.data(returnData)
						.enter()
						.append("svg:path")
						.attr("d", function (d) { return d; })
						.style("stroke", "lime")
						.style("visibility", "visible")
						.attr("marker-end", "url(#return-arrowhead)");

	var functionText = connectorGroup.selectAll("text")
                .data(callTextData)
                .enter()
                .append("text");

	functionText.text(function(d, i) {
				return trace.trace[d[2]].func_name;
			})
	        .attr("x", function(d, i) {
	            return xScale(d[0]) + 10;
	        })
	        .attr("y", function(d, i) {
	        	var mid = 0.5 * (d[1]+d[3]);
	            return yScale(mid) + 4;
	        })
	        .style("visibility", "visible")
	        .style("font-family", "monospace")
	        .style("font-size", "10pt");

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
	        	return 'black';
	        })
	        .style("visibility", "visible");

	/*
	 * =================================
	 *          DELIMITER GROUP
	 * =================================
	 */
	// build function call dataset (need to grab returns as well!)
	var functionCallDataset = [];
	for (var i = 0; i < dataset.length; i++) {
		if (trace.trace[i].event == 'call') {
			functionCallDataset.push([i, dataset[i], 'call']);
		} else if (trace.trace[i].event == 'return') {
			functionCallDataset.push([i, dataset[i], 'return']);
		}
	}

	var delimitingGroup = svg.append("svg:g");
	var delimiters = delimitingGroup.selectAll("line")
						.data(functionCallDataset)
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

	// save "top" position for debug panel
	var topPosition = myViz.domRoot.find('#debug').scrollTop();

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
	            function (d, i) {
					var row = table[0].rows[d];
					var cell = row.cells[0];
					myViz.domRoot.find('#code tr:eq(' + d + ') td:first').addClass("v-hover");
					myViz.domRoot.find('#code tr:eq(' + d + ') td:last').addClass("v-hover");
	                v_guides.filter(
	                    function(data, index) {
	                        return index == i;
	                    })
	                .style("visibility", "visible");
	                circles.filter(
	                    function(data, index) {
	                        return index == i;
	                    });

	                var svgOffset = myViz.domRoot.find('div#slider svg').offset();

	                // hide old tooltip
	                hideTooltip();

					if (d3.mouse(this)[1] > (yScale(d)-row_mid) && d3.mouse(this)[1] < (yScale(d+1)-row_mid) ) {
						$('#tooltip-step-id').text(i);
		                $('#holisticTooltip').show();
		                myViz.tooltipVisualizer.renderStep(i);
					    changeTooltipPosition(xScale(i) + svgOffset.left, yScale(d) + svgOffset.top);
					}
	            })
	        .on("mousemove",
	            function (d, i) {
					var row = table[0].rows[d];
					var cell = row.cells[0];
					myViz.domRoot.find('#code tr:eq(' + d + ') td:first').addClass("v-hover");
					myViz.domRoot.find('#code tr:eq(' + d + ') td:last').addClass("v-hover");
	                v_guides.filter(
	                    function(data, index) {
	                        return index == i;
	                    })
	                .style("visibility", "visible");

	                var svgOffset = myViz.domRoot.find('div#slider svg').offset();

	                // hide old tooltip
	                hideTooltip();

					if (d3.mouse(this)[1] > (yScale(d)-row_mid) && d3.mouse(this)[1] < (yScale(d+1)-row_mid) ) {
						$('#tooltip-step-id').text(i);
		                $('#holisticTooltip').show();
		                myViz.tooltipVisualizer.renderStep(i);
					    changeTooltipPosition(xScale(i) + svgOffset.left, yScale(d) + svgOffset.top);
					}
	            })
	        .on("mouseout",
	            function (d, i) {
					var row = table[0].rows[d];
					var cell = row.cells[0];
					myViz.domRoot.find('#code tr:eq(' + d + ') td:first').removeClass("v-hover");
					myViz.domRoot.find('#code tr:eq(' + d + ') td:last').removeClass("v-hover");
	                v_guides.filter(
	                    function(data, index) {
	                        return index == i;
	                    })
	                .style("visibility", "hidden");
	                circles.filter(
	                    function(data, index) {
	                        return index == i;
	                    });

	                hideTooltip();
	            })
	        .on("click", 
	        	function (d, i) {
	        		// debug panel
					myViz.domRoot.find('#debug-title').text(i);
					myViz.domRoot.find('#debug').html("<pre>"+JSON.stringify(trace.trace[i], undefined, 2)+"</pre>");
					myViz.domRoot.find('#debug').scrollTop(topPosition);

					if (d3.mouse(this)[1] > (yScale(d)-row_mid) && d3.mouse(this)[1] < (yScale(d+1)-row_mid) ) {
						// ExecutionVisualizer panel
						// use $('#altVisual').is(":visible") to check if visible
						if ($('#altContainer').is(":visible")) {
							if (altVisualStep == i) {
								$('#altContainer').hide();
							} else {
								$('#step-id').text(i);
								altVisualStep = i;
								myViz.altVisualizer.renderStep(altVisualStep);
							}
						} else {
							$('#step-id').text(i);
							altVisualStep = i;
							// have to draw arrows after the div is shown!
							$('#altContainer').show();
							myViz.altVisualizer.renderStep(altVisualStep);
						}
					}
				});

	// tooltip helper function
	var changeTooltipPosition = function(x, y) {
		var tooltipX = x - 8;
		var tooltipY = y + 8;
		var tooltipWidth = $('#holisticTooltip').width();
		// TODO: adjust for tooltip height
		if ((tooltipX + tooltipWidth) > $(window).width()) {
			$('#holisticTooltip').css({top: tooltipY, left: tooltipX - tooltipWidth});
		} else {
			$('#holisticTooltip').css({top: tooltipY, left: tooltipX});
		}
	};

	var hideTooltip = function() {
		$('#holisticTooltip').hide();
	};

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

	myViz.domRoot.find('#debugPanel').hide();
	myViz.domRoot.find('#debug-select').click(function() {
	    if($(this).is(':checked')){
	        myViz.domRoot.find('#debugPanel').show();
	    } else {
	        myViz.domRoot.find('#debugPanel').hide();
	    }
	});

	myViz.domRoot.find('#delimiter-select').click(function() {
	    if($(this).is(':checked')){
	        delimiters.style("visibility", "visible");
	    } else {
	        delimiters.style("visibility", "hidden");
	    }
	});
}

// stubs for unimplemented interface methods
HolisticVisualizer.prototype.updateOutput = function() {};
HolisticVisualizer.prototype.redrawConnectors = function() {
	this.altVisualizer.redrawConnectors();
};
HolisticVisualizer.prototype.destroyAllAnnotationBubbles = function() {};
