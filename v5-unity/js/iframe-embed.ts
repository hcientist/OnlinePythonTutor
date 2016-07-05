// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

/* TODO

- when you SLIDE the center vertical divider, visualizer arrows don't redraw :(

- test the resizeContainer option

*/

var pytutor = require('./pytutor.ts');
var assert = pytutor.assert;

require('../css/opt-frontend.css');

// need to directly import the class for typechecking to work
import {AbstractBaseFrontend} from './opt-frontend-common.ts';

var optFrontend; // singleton IframeEmbedFrontend object

class IframeEmbedFrontend extends AbstractBaseFrontend {
  originFrontendJsFile: string = 'iframe-embed.js';
  resizeContainer: boolean = false;

  constructor(resizeContainer) {
    super();
    this.resizeContainer = resizeContainer;
  }

  executeCode(forceStartingInstr=undefined, forceRawInputLst=undefined) {
    var queryStrOptions = optFrontend.getQueryStringOptions();

    var preseededCode = queryStrOptions.preseededCode;
    var pyState = queryStrOptions.py;
    var verticalStackBool = (queryStrOptions.verticalStack == 'true');
    var heapPrimitivesBool = (queryStrOptions.heapPrimitives == 'true');
    var textRefsBool = (queryStrOptions.textReferences == 'true');
    var cumModeBool = (queryStrOptions.cumulative == 'true');
    var drawParentPointerBool = (queryStrOptions.drawParentPointers == 'true');

    var codeDivWidth = undefined;
    var cdw = $.bbq.getState('codeDivWidth');
    if (cdw) {
      codeDivWidth = Number(cdw);
    }

    var codeDivHeight = undefined;
    var cdh = $.bbq.getState('codeDivHeight');
    if (cdh) {
      codeDivHeight = Number(cdh);
    }

    var startingInstruction = queryStrOptions.preseededCurInstr;
    if (!startingInstruction) {
      startingInstruction = 0;
    }

    // set up all options in a JS object
    var backendOptionsObj = {cumulative_mode: cumModeBool,
                             heap_primitives: heapPrimitivesBool,
                             origin: this.originFrontendJsFile};

    var frontendOptionsObj = {startingInstruction: startingInstruction,
                              embeddedMode: true,
                              verticalStack: verticalStackBool,
                              disableHeapNesting: heapPrimitivesBool,
                              drawParentPointers: drawParentPointerBool,
                              textualMemoryLabels: textRefsBool,
                              executeCodeWithRawInputFunc: this.executeCodeWithRawInput.bind(this),
                              heightChangeCallback: (this.resizeContainer ?
                                                     this.resizeContainerNow.bind(this) : undefined),
                              codeDivWidth: codeDivWidth,
                              codeDivHeight: codeDivHeight,
                             }

    if (forceStartingInstr) {
      frontendOptionsObj.startingInstruction = forceStartingInstr;
    }

    this.executeCodeAndCreateViz(preseededCode,
                                 pyState, backendOptionsObj,
                                 frontendOptionsObj,
                                 'vizDiv');
  }

  finishSuccessfulExecution() {
    if (this.resizeContainer) {
      this.resizeContainerNow();
    }
    this.myVisualizer.redrawConnectors();
  }

  handleUncaughtExceptionFunc(trace) {
    var excMsg = null;
    if (trace.length == 1) {
      excMsg = trace[0].exception_msg; // killer!
    } else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
      excMsg = trace[trace.length - 1].exception_msg;
    } else {
      excMsg = "Unknown error. Reload the page and try again. Or report a bug to philip@pgbovine.net";
    }
    $("#vizDiv").html(pytutor.htmlspecialchars(excMsg));
  }

  // David Pritchard's code for resizeContainer option ...
  resizeContainerNow() {
    function findContainer() {
      var ifs = window.top.document.getElementsByTagName("iframe");
      for(var i = 0, len = ifs.length; i < len; i++)  {
        var f = ifs[i];
        var fDoc = f.contentDocument || f.contentWindow.document;
        if (fDoc === document) {
          return f;
        }
      }
    }

    var container = findContainer();
    $(container).height($("html").height());
  }

} // END class IframeEmbedFrontend


$(document).ready(function() {
  var resizeContainer = ($.bbq.getState('resizeContainer') == 'true');
  optFrontend = new IframeEmbedFrontend(resizeContainer);

  // redraw connector arrows on window resize
  $(window).resize(function() {
    optFrontend.redrawConnectors();
  });

  optFrontend.executeCodeFromScratch(); // finally, execute code and display visualization
});
