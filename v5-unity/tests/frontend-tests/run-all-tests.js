const runFrontendTest = require('./frontend-golden-test').runFrontendTest;

// TODO: we can separate this out later into different subsets

// need to wrap in async to make it run serially
(async () => {
  await runFrontendTest('py2', 'homepage.trace', 'a', {disableHeapNesting: true, startingInstruction: 15});
  await runFrontendTest('py2', 'homepage.trace', 'b', {disableHeapNesting: false, startingInstruction: 15});

  await runFrontendTest('ruby', 'class-inheritance.trace', 'a', {disableHeapNesting: true, startingInstruction: 20});
  await runFrontendTest('ruby', 'class-inheritance.trace', 'b', {disableHeapNesting: false, startingInstruction: 20});

  await runFrontendTest('ruby', 'megagreeter.trace', 'a', {disableHeapNesting: true, startingInstruction: 40});
  await runFrontendTest('ruby', 'megagreeter.trace', 'b', {disableHeapNesting: false, startingInstruction: 40});
})();
