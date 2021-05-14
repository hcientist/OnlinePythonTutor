// Test opt-live.ts
var outputDir = "/test-optlive-outputs"


var baseUrl = 'http://localhost:8003/';

var urlFragments = [
  'http://localhost:8003/live.html#code=x%20%3D%20%22Enter%20your%20name%3A%20%22%0Ay%20%3D%20raw_input(x%29%0Aprint%20%22Hello%22,%20%20y%0Az%20%3D%20raw_input(y%20%2B%20%22%20-%3E%20%22%29%0Aprint%20z&cumulative=false&curInstr=1&heapPrimitives=true&mode=display&origin=opt-live.js&py=2&rawInputLstJSON=%5B%5D&textReferences=false',

  // with curInstr=69
  'http://localhost:8003/live.html#code=%23%20Higher-order%20functions%0A%23%20Adapted%20from%20MIT%206.01%20course%20notes%20(Section%20A.2.2%29%0A%23%20http%3A//mit.edu/6.01/mercurial/spring10/www/handouts/readings.pdf%0A%0Adef%20summation(low,%20high,%20f,%20%20next%29%3A%0A%20%20%20%20s%20%3D%200%0A%20%20%20%20x%20%3D%20low%0A%20%20%20%20while%20x%20%3C%3D%20high%3A%0A%20%20%20%20%20%20%20%20s%20%3D%20s%20%2B%20f(x%29%0A%20%20%20%20%20%20%20%20x%20%3D%20next(x%29%0A%20%20%20%20return%20s%0A%0Adef%20sumsquares(low,%20%20high%29%3A%0A%20%20%20%20return%20summation(low,%20high,%20lambda%20x%3A%20x**2,%20lambda%20x%3A%20x%2B1%29%0A%0Aprint(sumsquares(1,%20%2010%29%29&cumulative=false&curInstr=69&heapPrimitives=false&mode=display&origin=opt-live.js&py=2&rawInputLstJSON=%5B%5D&textReferences=false',

  // with rawInputLstJSON (and curInstr)
  'http://localhost:8003/live.html#code=x%20%3D%20%22Enter%20your%20name%3A%20%22%0Ay%20%3D%20raw_input(x%29%0Aprint%20%22Hello%22,%20y%0Az%20%3D%20raw_input(y%20%2B%20%22%20-%3E%20%22%29%0Aprint%20z&cumulative=false&curInstr=5&heapPrimitives=false&mode=display&origin=opt-live.js&py=2&rawInputLstJSON=%5B%22hello%22,%22world%22%5D&textReferences=false',
]


var DELAY_MS = 100;

var fs = require('fs');
var path = fs.absolute(fs.workingDirectory + '/phantomcss.js');
var phantomcss = require(path);

casper.test.begin('Testing OPT live mode, loading from URL strings', function (test) {
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
      casper.wait(1000, function() {
        phantomcss.screenshot('body', 'initialPageLoad'); // full-page screenshot!

        this.thenEvaluate(function() {
          document.querySelector("#raw_input_textbox").value = 'Philip';
        });

        this.thenClick('#raw_input_submit_btn', function then() {
          phantomcss.screenshot('body', 'afterRawInput1');
        });

        this.thenClick('#jmpStepBack', function then() {
          phantomcss.screenshot('body', 'afterRawInput1back');
        });

        this.thenClick('#jmpStepFwd', function then() {
          phantomcss.screenshot('body', 'afterRawInput1fwd');
        });

        this.thenClick('#jmpStepFwd', function then() {
          phantomcss.screenshot('body', 'afterRawInput1fwd');
        });

        this.thenEvaluate(function() {
          document.querySelector("#raw_input_textbox").value = 'Guo';
        });

        this.thenClick('#raw_input_submit_btn', function then() {
          phantomcss.screenshot('body', 'afterRawInput2');
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
