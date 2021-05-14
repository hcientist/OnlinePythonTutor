const runFrontendTest = require('./frontend-golden-test').runFrontendTest;

// TODO: we can separate this out later into different subsets

// need to wrap in async to make it run serially
(async () => {
  for (e of [false, true]) { // iterate over disableHeapNesting options
    await runFrontendTest('py2', 'homepage.trace', {disableHeapNesting: e, startingInstruction: 14});
    await runFrontendTest('py2', 'linked-list-1.trace', {disableHeapNesting: e, startingInstruction: 29, width: 1000, height: 1200});
    await runFrontendTest('py2', 'linked-list-2.trace', {disableHeapNesting: e, startingInstruction: 53, width: 1000, height: 1200});
    await runFrontendTest('py2', 'heap-jiggle.trace', {disableHeapNesting: e, startingInstruction: 2});
    await runFrontendTest('py2', 'heap-jiggle.trace', {disableHeapNesting: e, startingInstruction: 3});
    await runFrontendTest('py2', 'inheritance.trace', {disableHeapNesting: e, startingInstruction: 8});
    await runFrontendTest('py2', 'aliasing.trace', {disableHeapNesting: e, startingInstruction: 4});

    await runFrontendTest('py3', 'metaclass.trace', {disableHeapNesting: e, startingInstruction: 4});
    await runFrontendTest('py3', 'storture.trace', {disableHeapNesting: e, startingInstruction: 17});
    await runFrontendTest('py3', 'decorator.trace', {disableHeapNesting: e, startingInstruction: 19});
    await runFrontendTest('py3', 'tree.trace', {disableHeapNesting: e, startingInstruction: 1});

    await runFrontendTest('ruby', 'class-inheritance.trace', {disableHeapNesting: e, startingInstruction: 20});
    await runFrontendTest('ruby', 'megagreeter.trace', {disableHeapNesting: e, startingInstruction: 40});
    await runFrontendTest('ruby', 'big-class.trace', {disableHeapNesting: e, startingInstruction: 14});

    await runFrontendTest('java', 'linked-list.trace', {disableHeapNesting: e, startingInstruction: 28});
    await runFrontendTest('java', 'person-class.trace', {disableHeapNesting: e, startingInstruction: 23});

    // annoying pop-out 'bug':
    // https://github.com/pgbovine/OnlinePythonTutor/issues/216
    await runFrontendTest('js', 'popout.trace', {disableHeapNesting: e, startingInstruction: 1});
    await runFrontendTest('js', 'popout.trace', {disableHeapNesting: e, startingInstruction: 2});
    await runFrontendTest('js', 'popout.trace', {disableHeapNesting: e, startingInstruction: 3});
    await runFrontendTest('js', 'inheritance-popout.trace', {disableHeapNesting: e, startingInstruction: 4});
    await runFrontendTest('js', 'inheritance-popout.trace', {disableHeapNesting: e, startingInstruction: 5});
    await runFrontendTest('js', 'datatypes.trace', {disableHeapNesting: e, startingInstruction: 15});

    await runFrontendTest('c', 'thesis.trace', {disableHeapNesting: e, startingInstruction: 19});
    await runFrontendTest('c', 'turd-pointers.trace', {disableHeapNesting: e, startingInstruction: 10});
    await runFrontendTest('c', 'pointer-levels.trace', {disableHeapNesting: e, startingInstruction: 6});
    await runFrontendTest('c', 'array-param.trace', {disableHeapNesting: e, startingInstruction: 15});

    await runFrontendTest('cpp', 'cpp-class-date.trace', {disableHeapNesting: e, startingInstruction: 17});
    await runFrontendTest('cpp', 'cpp-class-pointers.trace', {disableHeapNesting: e, startingInstruction: 32});
  }
})();
