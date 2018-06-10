// created: 2018-06-10
// dependencies:
//   npm install puppeteer
//   npm install pixelmatch

const puppeteer = require('puppeteer');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG; // comes with pixelmatch
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const TEST_BASEDIR = 'tests/frontend-tests/' // relative to v5-unity/
const BASE_URL = 'http://localhost:8003/render-trace.html#';

// put width and height in options if you want a custom viewport width/height:
async function visitPageAndTakeScreenshot(traceUrl, outputFn, options) {
  const url = BASE_URL + 'traceFile=' + traceUrl + '&options=' + JSON.stringify(options);
  console.log(url);
  const size = {width: 800, height: 800};
  if (options.width && options.height) {
    size.width = options.width;
    size.height = options.height;
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport(size);
  await page.goto(url);
  await page.waitFor('#dataViz'); // wait until the visualization loads
  await page.screenshot({path: outputFn});
  await browser.close();
}


// the trace should exist in ${lang}/${traceFile}
// we are using language names as subdirectories since trace files
// (weirdly!) don't contain the language name
//
// testName is a unique name that you assign to this test, which should
// correspond to a particular set of values in the options object.
// we need testName to properly name the *.png files resulting from this test
async function runTest(lang, traceFile, testName, options) {
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
  await visitPageAndTakeScreenshot(traceUrl, outputFn, options);

  if (fs.existsSync(goldenFn)) {
    // there's a golden file, so run the test and compare against it
    console.log(goldenFn, 'does exists!');
  } else {
    // no golden file, so run the test and produce the golden file
    console.log(goldenFn, 'does not exist');
  }
}

runTest('py2', 'homepage.trace', 'a', {disableHeapNesting: true, startingInstruction: 15});
runTest('py2', 'homepage.trace', 'b', {disableHeapNesting: false, startingInstruction: 15});

/*
// use synchronous API for simplicity
const img1 = PNG.sync.read(fs.readFileSync('example.png'));
const img2 = PNG.sync.read(fs.readFileSync('example.golden.png'));

const diff = new PNG({width: img1.width, height: img1.height});

const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height,
                                 {
                                   threshold: 0.1
                                 });
console.log('numDiffPixels:', numDiffPixels);
diff.pack().pipe(fs.createWriteStream('diff.png'));
*/
