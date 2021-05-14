// Uses PhantomJS (phantomjs.org) to call Online Python Tutor to
// visualize and render screenshots of a Python file as .png images

// Created by Philip Guo on 2013-11-23

var DEBUG = true;

var page = require('webpage').create();
var system = require('system');
var fs = require('fs');

if (system.args.length < 3) {
  console.log('\nUsage:');
  console.log('phantomjs opt-screenshot-test.js <filename> <HTML file> <option string>');
  console.log('\nVisualizes execution of a Python file at localhost:8080 and renders');
  console.log('the state diagram at each step i as /tmp/<filename>.step.$i.png');
  phantom.exit(1);
}

var server = 'localhost:8080';
var fn = system.args[1];
var html = system.args[2]
var option_str = system.args[3];

var basename = fn.split(/[\\/]/).pop();

var pythonScript = fs.open(fn, 'r').read();

if (DEBUG) {
  console.log('Visualizing ...\n');
  console.log(pythonScript);
  console.log('--- please wait ---');
}

var scriptEncoded = encodeURIComponent(pythonScript);

// construct a URL with the script and options:
//var url = 'http://' + server + '/' + html + '#code=' + scriptEncoded + option_str;
var url = 'http://' + server + '/' + html + '#code=' + scriptEncoded +
          '&mode=display&showOnlyOutputs=false&' + option_str;

console.log(url);

page.open(url, function () {
    // impose a slight delay to make sure the page loads completely before working
    window.setTimeout(function () {

      // hide extraneous components and resize
      page.evaluate(function() {
          $("#experimentalHeader").hide();
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
          var outfn = '/tmp/' + basename + '.step.' + (i+1) + '.png';
          page.render(outfn);
          if (DEBUG) {
            console.log('Rendered step ' + (i+1) + ' / ' + (maxInstr+1), '\t' + outfn);
          }
      }

      phantom.exit()

    }, 1000);
});
