// Run a visual regression test on htmlPath, putting outputs in outputDir
var htmlPath = "http://localhost:8003/embedding-demo.html"
var outputDir = "/test-embedding-demo-outputs"

var DELAY_MS = 100;

var fs = require('fs');
var path = fs.absolute(fs.workingDirectory + '/phantomcss.js');
var phantomcss = require(path);

casper.test.begin('Testing ' + htmlPath, function (test) {
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
  casper.start(htmlPath);
  casper.viewport(1440, 900, function () {
    casper.waitFor(function check() {
      return this.evaluate(function() {
        return document.querySelectorAll("#happyDiv #dataViz").length > 0;
      });
    }, function then() {
      this.wait(DELAY_MS, function() {
        phantomcss.screenshot('body', 'embedding-demo-page');
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
