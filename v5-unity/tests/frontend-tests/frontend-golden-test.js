// visual frontend regression testing for OPT (see README.txt for details)
// created: 2018-06-10
// dependencies: puppeteer, pixelmatch, fs-extra (see ../../package.json)
//
// requires BASE_URL to work in a web browser, so you should start the webserver
// with 'npm start' from the v5-unity/ subdirectory *before* running tests

// exports a runFrontendTest function

const puppeteer = require('puppeteer');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG; // comes with pixelmatch
const fs = require('fs-extra'); // npm install fs-extra; drop-in replacement for built-in fs module
const path = require('path');
const assert = require('assert');


const TEST_BASEDIR = 'tests/frontend-tests/' // relative to v5-unity/
const BASE_URL = 'http://localhost:8003/render-trace.html#';


// put width and height in options if you want a custom viewport width/height:
async function visitPageAndTakeScreenshot(traceUrl, outputFn, options) {
  const url = BASE_URL + 'traceFile=' + traceUrl + '&options=' + JSON.stringify(options);
  //console.log(url);

  const size = {width: 800, height: 800};
  if (options.width && options.height) {
    size.width = options.width;
    size.height = options.height;
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport(size);
  try {
    await page.goto(url);
  } catch (e) {
    // if this page can't be visited, then BAIL
    console.log(`  ERROR cannot visit ${url}`);
    await browser.close();
    return;
  }
  await page.waitFor('#dataViz'); // wait until the visualization loads
  await page.screenshot({path: outputFn});
  await browser.close();
}


// the JSON trace should exist in ${lang}/${traceFile}
// NB: we're using language names as subdirectories since trace files (weirdly!)
// don't contain the language name.
//
// testName is a unique name that you assign to this test, which should
// correspond to a particular set of values in the options object.
// we need testName to properly name the *.png files resulting from this test
async function runFrontendTest(lang, traceFile, testName, options) {
  assert(fs.existsSync(path.join(lang, traceFile)));
  assert(testName);
  assert(typeof options === 'object');

  // always add these to options
  options.lang = lang;
  options.hideCode = true;

  const bn = path.basename(traceFile, '.trace');
  const outputFn = path.join(lang, `${bn}.${testName}.out.png`);
  const goldenFn = path.join(lang, `${bn}.${testName}.golden.png`);
  const diffFn = path.join(lang, `${bn}.${testName}.diff.png`);
  const traceUrl = path.join(TEST_BASEDIR, lang, traceFile); // #tricky

  await fs.remove(outputFn); // erase old version to be prevent staleness
  await visitPageAndTakeScreenshot(traceUrl, outputFn, options);
  assert(fs.existsSync(outputFn));
  console.log(`Created ${outputFn}`);

  if (fs.existsSync(goldenFn)) {
    const img1 = PNG.sync.read(fs.readFileSync(goldenFn));
    const img2 = PNG.sync.read(fs.readFileSync(outputFn));
    const diff = new PNG({width: img1.width, height: img1.height});

    const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data,
                                     img1.width, img1.height,
                                     {threshold: 0.1});
    if (numDiffPixels > 0) {
      console.log(`  ERROR: ${numDiffPixels}-pixel diff from golden: see ${diffFn}`);
      diff.pack().pipe(fs.createWriteStream(diffFn));
    }
  } else {
    console.log(`  ${outputFn} -> ${goldenFn}`);
    fs.copySync(outputFn, goldenFn);
  }
}

exports.runFrontendTest = runFrontendTest;
