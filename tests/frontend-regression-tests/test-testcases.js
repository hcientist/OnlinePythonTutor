// Test the 'add a test case' feature
var outputDir = "/test-testcases-outputs"


var baseUrl = 'http://localhost:8003/';

// test visualize.html (mode=edit, mode=display), iframe-embed.html, and live.html
var urlFragments = [
  'http://localhost:8003/visualize.html#code=def+multiply(a,+b,+c%29%3A%0A++++return+a+*+b+*+c&mode=edit&origin=opt-frontend.js&cumulative=false&heapPrimitives=false&textReferences=false&py=2&rawInputLstJSON=%5B%5D&testCasesJSON=%5B%22assert+multiply(1,2,3%29+%3D%3D+6%22,%22assert+multiply(3,2,1%29+%3D%3D+5%22,%22assert+multiply(1,2%29+%3D%3D+2%5Cn%23+assert+%3Ctest+condition%3E%22,%22assert+multiply(1,2%29+%3D+3%5Cn%23+assert+%3Ctest+condition%3E%22%5D',

]


var DELAY_MS = 100;

var fs = require('fs');
var path = fs.absolute(fs.workingDirectory + '/phantomcss.js');
var phantomcss = require(path);

casper.test.begin('Testing OPT test cases, loading from URL strings', function (test) {
  // boring setup code taken from PhantomCSS demo
  phantomcss.init({
    rebase: casper.cli.get( "rebase" ),
    // SlimerJS needs explicit knowledge of this Casper, and lots of absolute paths
    casper: casper,
    libraryRoot: fs.absolute( fs.workingDirectory + '' ),
    screenshotRoot: fs.absolute( fs.workingDirectory + outputDir + '/screenshots' ),
    failedComparisonsRoot: fs.absolute( fs.workingDirectory + outputDir + '/failures' ),
    addLabelToFailedImage: false,
  });

  casper.on('remote.message', function(msg) {this.echo(msg);});
  casper.on('error', function (err) {this.die( "PhantomJS has errored: " + err );});
  casper.on('resource.error', function (err) {casper.log( 'Resource load error: ' + err, 'warning' );});


  // start with a baseline image
  casper.start();
  casper.viewport(1440, 900);
  casper.options.waitTimeout = 10000; // longer default timeout

  casper.each(urlFragments, function then(self, e) {
    // the TRICK is to first go to a different URL or else the app
    // doesn't recognize the URL hashstate change ... which is admittedly a
    // bug in OPT right now. but to work around it, simply open a
    // different URL between page loads:
    self.thenOpen('about:blank');

    self.thenOpen(e, function() {
      phantomcss.screenshot('#pyInputPane', 'pageLoaded');

      casper.wait(DELAY_MS, function() {
        this.click("#runAllTestsButton");
        casper.wait(2000, function then() {
          phantomcss.screenshot('#pyInputPane', 'testsRun');
        });
      });

      casper.thenClick('#vizTestCase_3', function() {
        casper.waitFor(function check() {
          return this.evaluate(function() {
            return document.querySelectorAll("#dataViz").length > 0;
          });
        }, function then() {
          phantomcss.screenshot('.visualizer', 'failingTest');
        });
      });
    });

  });


  // run all tests:
  casper.then(function now_check_the_screenshots() {
    phantomcss.compareAll(); // compare screenshots
  });

  casper.run(function() {
    //phantomcss.getExitStatus() // pass or fail?
    casper.test.done();
  });
});
