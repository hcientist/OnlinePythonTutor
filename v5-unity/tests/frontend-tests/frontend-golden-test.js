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
const stable_stringify = require('json-stable-stringify'); // for deterministic hashing
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');

const TEST_BASEDIR = 'tests/frontend-tests/' // relative to v5-unity/
const BASE_URL = 'http://localhost:8003/render-trace.html#';

const RED = '\033[91m';
const ENDCOLOR = '\033[0m';


// put width and height in options if you want a custom viewport width/height:
async function visitPageAndTakeScreenshot(traceUrl, outputFn, options) {
  const url = BASE_URL + 'traceFile=' + traceUrl + '&options=' + JSON.stringify(options);
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
    console.log(`  SERVER ERROR - cannot open ${url}`);
    await browser.close();
    return;
  }
  await page.waitFor('#dataViz'); // wait until the visualization loads
  await page.screenshot({path: outputFn});
  await browser.close();

  return url;
}


// the JSON trace should exist in ${lang}/${traceFile}
// NB: we're using language names as subdirectories since trace files (weirdly!)
// don't contain the language name.
async function runFrontendTest(lang, traceFile, options) {
  const traceRelPath = path.join(lang, traceFile);
  assert(fs.existsSync(traceRelPath));
  assert(typeof options === 'object');

  // always add these to the options object:
  options.lang = lang;
  options.hideCode = true;

  const optionsStr = stable_stringify(options);

  // generate a short unique test name based on the contents of options:
  const testName = crypto.createHash('md5').update(optionsStr).digest("hex").substr(0, 5);

  const bn = path.basename(traceFile, '.trace');
  const outputFn = path.join(lang, `${bn}.${testName}.out.png`);
  const goldenFn = path.join(lang, `${bn}.${testName}.golden.png`);
  const diffFn = path.join(lang, `${bn}.${testName}.diff.png`);
  const traceUrl = path.join(TEST_BASEDIR, lang, traceFile); // #tricky

  await fs.remove(diffFn); // erase old version to be prevent staleness
  await fs.remove(outputFn); // erase old version to be prevent staleness
  const url = await visitPageAndTakeScreenshot(traceUrl, outputFn, options);
  assert(fs.existsSync(outputFn));
  console.log(`Testing ${outputFn} ${optionsStr}`);

  if (fs.existsSync(goldenFn)) {
    const img1 = PNG.sync.read(fs.readFileSync(goldenFn));
    const img2 = PNG.sync.read(fs.readFileSync(outputFn));
    const diff = new PNG({width: img1.width, height: img1.height});

    const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data,
                                     img1.width, img1.height,
                                     {threshold: 0.1});
    if (numDiffPixels > 0) {
      console.log(`  ${RED}ERROR: ${numDiffPixels}-pixel diff from golden${ENDCOLOR} - see ${diffFn}`);
      console.log(`  ${url}`);
      diff.pack().pipe(fs.createWriteStream(diffFn));
    }
  } else {
    console.log(`  ${outputFn} -> ${goldenFn}`);
    fs.copySync(outputFn, goldenFn);
  }
}

exports.runFrontendTest = runFrontendTest;
