// Uses PhantomJS (phantomjs.org) to call Online Python Tutor to
// visualize and render screenshots of a Python file as .png images

// Created by Philip Guo on 2013-11-23

// TODO: experiment with PDF rendering by calling page.render() with a
// .pdf file extension. We might need to mess around with viewport and
// page sizes.

var DEBUG = true;

var page = require('webpage').create();
var system = require('system');
var fs = require('fs');

var fn, server, option_str;

if (system.args.length < 2) {
  console.log('\nUsage:');
  console.log('phantomjs render-opt-screenshots.js <filename> [custom server name] [custom option string]');
  console.log('\nVisualizes execution of a Python file at pythontutor.com and renders');
  console.log('the state diagram at each step i as <filename>.step.$i.png');
  phantom.exit(1);
}
else if (system.args.length == 2) {
  fn = system.args[1];
  // default options
  server = 'www.pythontutor.com';
  option_str = 'cumulative=false&heapPrimitives=false&drawParentPointers=false&textReferences=false&py=2';
}
else {
  fn = system.args[1];
  server = system.args[2];
  option_str = system.args[3];
}

var pythonScript = fs.open(fn, 'r').read();

if (DEBUG) {
  console.log('Visualizing ...\n');
  console.log(pythonScript);
  console.log('--- please wait ---');
}

var scriptEncoded = encodeURIComponent(pythonScript);

// construct a URL with the script and options:
var url = 'http://' + server + '/visualize.html#code=' + scriptEncoded +
          '&mode=display&showOnlyOutputs=false&' + option_str;

page.open(url, function () {
    // impose a slight delay to make sure the page loads completely before working
    window.setTimeout(function () {

      // hide extraneous components and resize
      page.evaluate(function() {
          $("#surveyHeader").hide();
          $("#footer").hide();
          $("#vizLayoutTdFirst").hide();
          $('#pyOutputPane').width($('table.visualizer').width());
      });

      // grab maximum instruction from the page itself
      var maxInstr = page.evaluate(function() {
          return myVisualizer.curTrace.length - 1;
      });

      // ignore step 0 since there's nothing interesting to render there
      for (var i=1; i <= maxInstr; i++) {
          page.evaluate(function(i) {
              myVisualizer.curInstr = i;
              myVisualizer.updateOutput();
          }, i /* pass i in here */);
          var outfn = fn + '.step.' + (i+1) + '.png';
          page.render(outfn);
          if (DEBUG) {
            console.log('Rendered step ' + (i+1) + ' / ' + (maxInstr+1), '\t' + outfn);
          }
      }

      phantom.exit()

    }, 1000);
});
