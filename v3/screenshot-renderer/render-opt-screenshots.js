// Uses PhantomJS (phantomjs.org) to call Online Python Tutor to
// visualize and render screenshots of a Python file as .png images

// Created by Philip Guo on 2013-11-23

// TODO: experiment with PDF rendering by calling page.render() with a
// .pdf file extension. We might need to mess around with viewport and
// page sizes.


var page = require('webpage').create();
var system = require('system');
var fs = require('fs');

if (system.args.length < 2) {
  console.log('\nUsage:\n  phantomjs render-opt-screenshots.js <filename>');
  console.log('\nVisualizes execution of a Python file at pythontutor.com and renders');
  console.log('the state diagram at each step i as <filename>.step.$i.png');
  phantom.exit(1);
}

fn = system.args[1];

var pythonScript = fs.open(fn, 'r').read();
console.log('Visualizing ...\n');
console.log(pythonScript);
console.log('--- please wait ---');

var scriptEncoded = encodeURIComponent(pythonScript);

// construct a URL with the script and options:
// (for instance, to run with Python 3, change the 'py=2' string to 'py=3')
var url = 'http://www.pythontutor.com/visualize.html#code=' +
          scriptEncoded +
          '&mode=display' +
          '&cumulative=false' +
          '&heapPrimitives=false' +
          '&drawParentPointers=false' +
          '&textReferences=false' +
          '&showOnlyOutputs=false' +
          '&py=2' +
          '&curInstr=0';

page.open(url, function () {
    // impose a slight delay to make sure the page loads completely before working
    window.setTimeout(function () {

      // hide extraneous components and resize
      page.evaluate(function() {
          $("#footer").hide();
          $("#vizLayoutTdFirst").hide();
          $('#pyOutputPane').width($('table.visualizer').width());
      });

      // grab maximum instruction from the page itself
      var maxInstr = page.evaluate(function() {
          return myVisualizer.curTrace.length - 1;
      });

      for (var i=0; i <= maxInstr; i++) {
          page.evaluate(function(i) {
              myVisualizer.curInstr = i;
              myVisualizer.updateOutput();
          }, i /* pass i in here */);
          var outfn = fn + '.step.' + (i+1) + '.png';
          page.render(outfn);
          console.log('Rendered step ' + (i+1) + ' of ' + (maxInstr+1));
      }

      phantom.exit()

    }, 1000);
});

