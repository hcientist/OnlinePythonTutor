// Run a visual regression test on htmlPath, putting outputs in outputDir
var htmlPath = "http://localhost:8003/visualize.html"
var outputDir = "/test-visualize-html-outputs"

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
    phantomcss.screenshot('#pyInputPane', 'pyInputPane');
  });

  // click on one example code for each language
  var exampleLinksToClick = [
    "#aliasExampleLink",
    "#tortureLink",
    "#javaVarLink",
    "#jsDatatypesExLink",
    "#tsGreeterExLink",
    "#rubyConstantsLink",
    "#cMengThesisLink",
    "#cppFirstLink"];

  exampleLinksToClick.forEach(function (e, i) {
    casper.thenClick(e, function() {
      phantomcss.screenshot('#pyInputPane', 'pyInputPane');
    });
  });


  // now test the visualize mode:
  casper.thenClick("#aliasExampleLink", function() {
    // brief wait for code to load
    this.wait(DELAY_MS, function() {
      this.click("#executeBtn");
    });
  });

  // after clicking on executeBtn, wait for the dataViz div to appear
  // because that means the visualizer has rendered:
  casper.waitFor(function check() {
    return this.evaluate(function() {
      return document.querySelectorAll("#dataViz").length > 0;
    });
  }, function then() {
    phantomcss.screenshot('.visualizer', 'visualizer');
  });

  // this example has 31 steps:
  for (var i = 0; i < 31; i++) {
    casper.thenClick("#jmpStepFwd", function() {
      // slight pause for vis to settle
      this.wait(DELAY_MS, function() {
        phantomcss.screenshot('.visualizer', 'visualizer');
      });
    });
  }


  // for the remaining examples, be brief and take only a snapshot of
  // the FINAL state of the visualization

  // test instruction limit reached
  casper.thenClick("#genPrimesLink", function() {
    // brief wait for code to load
    this.wait(DELAY_MS, function() {
      casper.click("#executeBtn");

      casper.waitFor(function check() {
        return this.evaluate(function() {
          return document.querySelectorAll("#dataViz").length > 0;
        });
      }, function then() {
        casper.click('#jmpLastInstr');
        phantomcss.screenshot('.visualizer', 'visualizer_instr_limit_reached');
      });
    });
  });

  // test exception
  casper.thenClick("#pwTryFinallyLink", function() {
    // brief wait for code to load
    this.wait(DELAY_MS, function() {
      casper.click("#executeBtn");

      casper.waitFor(function check() {
        return this.evaluate(function() {
          return document.querySelectorAll("#dataViz").length > 0;
        });
      }, function then() {
        casper.click('#jmpLastInstr');
        phantomcss.screenshot('.visualizer', 'visualizer_exception');
      });
    });
  });


  // for these examples, just snapshot dataViz to be even briefer:
  var exampleTestLinks = [
    '#tutorialExampleLink',
    '#ll2Link',
    '#inheritanceExampleLink',
    '#aliasing2Link',
    '#aliasing3Link',
    '#aliasing7Link',
    '#closure5Link'];

  exampleTestLinks.forEach(function(e, i) {
    // reset all toggles to test regular visualizer
    casper.thenEvaluate(function() {
      document.querySelector('#cumulativeModeSelector').value = "false";
      document.querySelector('#heapPrimitivesSelector').value = "false";
      document.querySelector('#textualMemoryLabelsSelector').value = "false";
    });

    casper.wait(DELAY_MS, function() {
      casper.click(e);
      // brief wait for code to load
      this.wait(DELAY_MS, function() {
        casper.click("#executeBtn");

        casper.waitFor(function check() {
          return this.evaluate(function() {
            return document.querySelectorAll("#dataViz").length > 0;
          });
        }, function then() {
          casper.click('#jmpLastInstr');
          phantomcss.screenshot('#dataViz', 'dataViz_' + e);
        });
      });
    });


    // simulate what's done for composingprograms
    casper.thenEvaluate(function() {
      document.querySelector('#cumulativeModeSelector').value = "true";
      document.querySelector('#heapPrimitivesSelector').value = "false";
      document.querySelector('#textualMemoryLabelsSelector').value = "false";
    });

    casper.wait(DELAY_MS, function() {
      casper.click(e);
      // brief wait for code to load
      this.wait(DELAY_MS, function() {
        casper.click("#executeBtn");
        casper.waitFor(function check() {
          return this.evaluate(function() {
            return document.querySelectorAll("#dataViz").length > 0;
          });
        }, function then() {
          casper.click('#jmpLastInstr');
          phantomcss.screenshot('#dataViz', 'dataViz_' + e + '_CUMULATIVE');
        });
      });
    });


    // simulate what's done for csc108h
    casper.thenEvaluate(function() {
      document.querySelector('#cumulativeModeSelector').value = "false";
      document.querySelector('#heapPrimitivesSelector').value = "true";
      document.querySelector('#textualMemoryLabelsSelector').value = "true";
    });

    casper.wait(DELAY_MS, function() {
      casper.click(e);
      // brief wait for code to load
      this.wait(DELAY_MS, function() {
        casper.click("#executeBtn");
        casper.waitFor(function check() {
          return this.evaluate(function() {
            return document.querySelectorAll("#dataViz").length > 0;
          });
        }, function then() {
          casper.click('#jmpLastInstr');
          phantomcss.screenshot('#dataViz', 'dataViz_' + e + '_TEXTLABELS');
        });
      });
    });

  }); // end forEach


  // run all tests:
  casper.then(function now_check_the_screenshots() {
    phantomcss.compareAll(); // compare screenshots
  });

  casper.run(function() {
    //phantomcss.getExitStatus() // pass or fail?
    casper.test.done();
  });
});
