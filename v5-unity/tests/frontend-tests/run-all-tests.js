const runFrontendTest = require('./frontend-golden-test').runFrontendTest;

// TODO: we can separate this out later into different subsets
runFrontendTest('py2', 'homepage.trace', 'a', {disableHeapNesting: true, startingInstruction: 15});
runFrontendTest('py2', 'homepage.trace', 'b', {disableHeapNesting: false, startingInstruction: 15});
