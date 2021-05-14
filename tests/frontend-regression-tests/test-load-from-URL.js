// Run a visual regression test of direct URL loading, putting outputs in outputDir
var outputDir = "/test-load-from-URL-outputs"


var baseUrl = 'http://localhost:8003/';

// test visualize.html (mode=edit, mode=display), iframe-embed.html, and live.html
var urlFragments = [
  // Python
  '#code=%23%20Higher-order%20functions%0A%23%20Adapted%20from%20MIT%206.01%20course%20notes%20(Section%20A.2.2%29%0A%23%20http%3A//mit.edu/6.01/mercurial/spring10/www/handouts/readings.pdf%0A%0Adef%20summation(low,%20high,%20f,%20next%29%3A%0A%20%20%20%20s%20%3D%200%0A%20%20%20%20x%20%3D%20low%0A%20%20%20%20while%20x%20%3C%3D%20high%3A%0A%20%20%20%20%20%20%20%20s%20%3D%20s%20%2B%20f(x%29%0A%20%20%20%20%20%20%20%20x%20%3D%20next(x%29%0A%20%20%20%20return%20s%0A%0Adef%20sumsquares(low,%20high%29%3A%0A%20%20%20%20return%20summation(low,%20high,%20lambda%20x%3A%20x**2,%20lambda%20x%3A%20x%2B1%29%0A%0Aprint(sumsquares(1,%2010%29%29&codeDivHeight=400&codeDivWidth=350&cumulative=true&curInstr=41&heapPrimitives=true&origin=opt-frontend.js&py=2&rawInputLstJSON=%5B%5D&textReferences=true',

  // Python again (it claims python 3 but actually runs python 2 on
  // localhost, but anyways just want to test that the py=3 switch works)
  '#code=%23%20move%20a%20stack%20of%20n%20disks%20from%20stack%20a%20to%20stack%20b,%0A%23%20using%20tmp%20as%20a%20temporary%20stack%0Adef%20TowerOfHanoi(n,%20a,%20b,%20tmp%29%3A%0A%20%20%20%20if%20n%20%3D%3D%201%3A%0A%20%20%20%20%20%20%20%20b.append(a.pop(%29%29%0A%20%20%20%20else%3A%0A%20%20%20%20%20%20%20%20TowerOfHanoi(n-1,%20a,%20tmp,%20b%29%0A%20%20%20%20%20%20%20%20b.append(a.pop(%29%29%0A%20%20%20%20%20%20%20%20TowerOfHanoi(n-1,%20tmp,%20b,%20a%29%0A%20%20%20%20%20%20%20%20%0Astack1%20%3D%20%5B4,3,2,1%5D%0Astack2%20%3D%20%5B%5D%0Astack3%20%3D%20%5B%5D%0A%20%20%20%20%20%20%0A%23%20transfer%20stack1%20to%20stack3%20using%20Tower%20of%20Hanoi%20rules%0ATowerOfHanoi(len(stack1%29,%20stack1,%20stack3,%20stack2%29&cumulative=false&curInstr=75&heapPrimitives=true&origin=opt-frontend.js&py=3&rawInputLstJSON=%5B%5D&textReferences=false',

  // JS
  '#code=//%20Adapted%20from%20Effective%20JavaScript%0Afunction%20Actor(x,%20y%29%20%7B%0A%20%20this.x%20%3D%20x%3B%0A%20%20this.y%20%3D%20y%3B%0A%7D%0A%0AActor.prototype.moveTo%20%3D%20function(x,%20y%29%20%7B%0A%20%20this.x%20%3D%20x%3B%0A%20%20this.y%20%3D%20y%3B%0A%7D%0A%0Afunction%20SpaceShip(x,%20y%29%20%7B%0A%20%20Actor.call(this,%20x,%20y%29%3B%0A%20%20this.points%20%3D%200%3B%0A%7D%0A%0ASpaceShip.prototype%20%3D%20Object.create(Actor.prototype%29%3B%20//%20inherit!%0ASpaceShip.prototype.type%20%3D%20%22spaceship%22%3B%0ASpaceShip.prototype.scorePoint%20%3D%20function(%29%20%7B%0A%20%20this.points%2B%2B%3B%0A%7D%0A%0Avar%20s%20%3D%20new%20SpaceShip(10,%2020%29%3B%0As.moveTo(30,%2040%29%3B%0As.scorePoint(%29%3B%0As.scorePoint(%29%3B&cumulative=false&curInstr=14&heapPrimitives=false&origin=opt-frontend.js&py=js&rawInputLstJSON=%5B%5D&textReferences=false',
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
