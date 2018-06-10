// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

// renders a trace file passed in a URL path and with the given frontend options
// created: 2018-06-09
//
// example invocation:
// http://localhost:8003/render-trace.html#traceFile=tests/frontend-tests/python/homepage.trace&options={%22hideCode%22:%20true,%20%20%22disableHeapNesting%22:true,%20%22lang%22:%20%22py2%22,%20%22startingInstruction%22:%2015}

import {ExecutionVisualizer} from './pytutor';

$(document).ready(function() {
  const traceFile = $.bbq.getState('traceFile');
  const frontendOptionsJson = $.bbq.getState('options');
  let frontendOptions = {};
  if (frontendOptionsJson) {
    frontendOptions = JSON.parse(frontendOptionsJson);
  }

  console.log('traceFile:', traceFile, 'frontendOptions:', frontendOptions);
  $.getJSON(traceFile, (trace) => {
    var myViz = new ExecutionVisualizer('visualizerDiv', trace, frontendOptions);
  });
});
