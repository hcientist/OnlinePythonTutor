// Visually test visualize.html on localhost
var htmlPath = "http://localhost:8003/visualize.html"

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
    screenshotRoot: fs.absolute( fs.workingDirectory + '/screenshots' ),
    failedComparisonsRoot: fs.absolute( fs.workingDirectory + '/demo/failures' ),
    addLabelToFailedImage: false,
  });

  casper.on('remote.message', function(msg) {this.echo(msg);});
  casper.on('error', function (err) {this.die( "PhantomJS has errored: " + err );});
  casper.on('resource.error', function (err) {casper.log( 'Resource load error: ' + err, 'warning' );});


  casper.start(htmlPath);
  casper.viewport(1440, 900, function () {
    phantomcss.screenshot('#pyInputPane', 'pyInputPane');
  });

  // click on one example code for each language
  casper.then(function() {
    casper.click("#aliasExampleLink");
    phantomcss.screenshot('#pyInputPane', 'pyInputPane');
  });

  casper.then(function() {
    casper.click("#tortureLink");
    phantomcss.screenshot('#pyInputPane', 'pyInputPane');
  });

  casper.then(function() {
    casper.click("#javaVarLink");
    phantomcss.screenshot('#pyInputPane', 'pyInputPane');
  });

  casper.then(function() {
    casper.click("#jsDatatypesExLink");
    phantomcss.screenshot('#pyInputPane', 'pyInputPane');
  });

  casper.then(function() {
    casper.click("#tsGreeterExLink");
    phantomcss.screenshot('#pyInputPane', 'pyInputPane');
  });

  casper.then(function() {
    casper.click("#rubyConstantsLink");
    phantomcss.screenshot('#pyInputPane', 'pyInputPane');
  });

  casper.then(function() {
    casper.click("#cMengThesisLink");
    phantomcss.screenshot('#pyInputPane', 'pyInputPane');
  });

  casper.then(function() {
    casper.click("#cppFirstLink");
    phantomcss.screenshot('#pyInputPane', 'pyInputPane');
  });


  // run all the tests:
  casper.then(function now_check_the_screenshots() {
    phantomcss.compareAll(); // compare screenshots
  });

  casper.run(function() {
    //phantomcss.getExitStatus() // pass or fail?
    casper.test.done();
  });
});
