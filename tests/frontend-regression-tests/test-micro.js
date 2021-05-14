// a micro-test that can run super quickly between code edits, for sanity checks
var outputDir = "/test-micro-outputs"


var baseUrl = 'http://localhost:8003/';

// test visualize.html (mode=edit, mode=display), iframe-embed.html, and live.html
var urlFragments = [
  // Python
  '#code=%23%20Higher-order%20functions%0A%23%20Adapted%20from%20MIT%206.01%20course%20notes%20(Section%20A.2.2%29%0A%23%20http%3A//mit.edu/6.01/mercurial/spring10/www/handouts/readings.pdf%0A%0Adef%20summation(low,%20high,%20f,%20next%29%3A%0A%20%20%20%20s%20%3D%200%0A%20%20%20%20x%20%3D%20low%0A%20%20%20%20while%20x%20%3C%3D%20high%3A%0A%20%20%20%20%20%20%20%20s%20%3D%20s%20%2B%20f(x%29%0A%20%20%20%20%20%20%20%20x%20%3D%20next(x%29%0A%20%20%20%20return%20s%0A%0Adef%20sumsquares(low,%20high%29%3A%0A%20%20%20%20return%20summation(low,%20high,%20lambda%20x%3A%20x**2,%20lambda%20x%3A%20x%2B1%29%0A%0Aprint(sumsquares(1,%2010%29%29&curInstr=41&origin=opt-frontend.js&py=2&rawInputLstJSON=%5B%5D',
]


var DELAY_MS = 100;

var fs = require('fs');
var path = fs.absolute(fs.workingDirectory + '/phantomcss.js');
var phantomcss = require(path);

casper.test.begin('Testing page loads from URL strings', function (test) {
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
    var urlFrag = e;
    var visualizeHtmlEditMode = baseUrl + 'visualize.html' + e + '&mode=edit';
    var visualizeHtmlDisplayMode = baseUrl + 'visualize.html' + e + '&mode=display';
    var iframeEmbedHtml = baseUrl + 'iframe-embed.html' + e;
    var liveHtml = baseUrl + 'live.html' + e + '&mode=display'; // annoying hack - need mode=display to jump to a step in curInstr

    // the TRICK is to first go to a different URL or else the app
    // doesn't recognize the URL hashstate change ... which is admittedly a
    // bug in OPT right now. but to work around it, simply open a
    // different URL between page loads:
    self.thenOpen('about:blank');

    self.thenOpen(visualizeHtmlEditMode, function() {
      phantomcss.screenshot('#pyInputPane', 'testEditModeEditor');

      casper.wait(DELAY_MS, function() {
        this.click("#executeBtn");
        // after clicking on executeBtn, wait for the dataViz div to appear
        // because that means the visualizer has rendered:
        casper.waitFor(function check() {
          return this.evaluate(function() {
            return document.querySelectorAll("#dataViz").length > 0;
          });
        }, function then() {
          // jump to the last step, then take a screenshot
          casper.click('#jmpLastInstr');
          phantomcss.screenshot('.visualizer', 'testEditModeVisualizer');
        });
      });
    });


    self.thenOpen('about:blank');
    self.thenOpen(visualizeHtmlDisplayMode, function() {
      casper.waitFor(function check() {
        return this.evaluate(function() {
          return document.querySelectorAll("#dataViz").length > 0;
        });
      }, function then() {
        phantomcss.screenshot('.visualizer', 'testDisplayMode');
      });
    });


    self.thenOpen('about:blank');
    self.thenOpen(iframeEmbedHtml, function() {
      casper.waitFor(function check() {
        return this.evaluate(function() {
          return document.querySelectorAll("#dataViz").length > 0;
        });
      }, function then() {
        phantomcss.screenshot('.visualizer', 'testIframeEmbed');
      });
    });


    self.thenOpen('about:blank');
    self.thenOpen(liveHtml, function() {
      casper.waitFor(function check() {
        return this.evaluate(function() {
          return document.querySelectorAll("#dataViz").length > 0;
        });
      }, function then() {
        phantomcss.screenshot('body', 'testLiveMode'); // full-page screenshot!
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
