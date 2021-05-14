// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

import {ExecutionVisualizer} from './pytutor';

var allVisualizers = [];

function redrawAllVisualizerArrows() {
  $.each(allVisualizers, (i, v) => {
    console.log("redrawConnectors:", v);
    v.redrawConnectors();
  });
  console.log("DONE redrawAllVisualizerArrows");
}

// creates a ExecutionVisualizer representing trace and adds it to page at divId
// returns the newly-created ExecutionVisualizer object
function addVisualizerToPage(trace, divId, params) {
  if (!params) {
    params = {};
  }

  if (params.embeddedMode === undefined) {
    params.embeddedMode = true;
  }
  if (params.editCodeBaseURL === undefined) {
    params.editCodeBaseURL = 'http://pythontutor.com/visualize.html';
  }

  // When some div in your webpage (such as a visualizer div) expands in height,
  // it will "push down" all divs below it, but the SVG arrows rendered by
  // jsPlumb WILL NOT MOVE. Thus, they will be in the incorrect location unless
  // you call redrawAllConnectors().
  //
  // We use the "heightChangeCallback" optional parameter to force redraw
  // of all SVG arrows of ALL visualizers, whenever the height of one changes.
  //
  // Alternatively, here is one jQuery plugin that you can use to detect
  // div height changes: http://benalman.com/projects/jquery-resize-plugin/
  //
  // A related trick you can implement is to make a div never shrink in height
  // once it's grown; that way, you can avoid lots of jarring jumps and
  // (inefficient) redraws.
  params.heightChangeCallback = redrawAllVisualizerArrows;

  var ret = new ExecutionVisualizer(divId, trace, params);
  allVisualizers.push(ret);
  redrawAllVisualizerArrows();

  // Call redrawConnectors() on all visualizers whenever the window is resized,
  // since HTML elements might have moved during a resize. The SVG arrows rendered
  // by jsPlumb don't automatically get re-drawn in their new positions unless
  // redrawConnectors() is called.
  //
  // detach the handler first so that we don't have redundant multiple handlers:
  $(window).off('resize').resize(redrawAllVisualizerArrows);
  return ret;
}

// loads trace from a JSON-formatted file and then adds it to the page in divId;
// returns the newly-created ExecutionVisualizer object
function createVisualizerFromJSON(jsonURL, divId, params=undefined) {
  $.get(jsonURL, {}, function(trace) {
    //console.log(trace);
    addVisualizerToPage(trace, divId, params);
  }, 'json');
}

// looks for all div.pytutorVisualizer on the current page, extracts
// data-tracefile and data-params attributes from each, and then populates
// each one using createVisualizerFromJSON()
function createAllVisualizersFromHtmlAttrs() {
  //console.log('createAllVisualizersFromHtmlAttrs');
  $('div.pytutorVisualizer').each(function(i, e) {
    var jsonURL = $(e).attr('data-tracefile');
    var divId = $(e).attr('id');
    var paramsText = $(e).attr('data-params');
    //console.log(jsonURL, divId, paramsText);
    try {
      var params = JSON.parse(paramsText);
      createVisualizerFromJSON(jsonURL, divId, params);
    } catch(err) {
      createVisualizerFromJSON(jsonURL, divId); // ignore params if we can't parse it
    }
  });
}

// export globally -- hacky!!!
(window as any).addVisualizerToPage = addVisualizerToPage;
(window as any).createVisualizerFromJSON = createVisualizerFromJSON;
(window as any).createAllVisualizersFromHtmlAttrs = createAllVisualizersFromHtmlAttrs;
