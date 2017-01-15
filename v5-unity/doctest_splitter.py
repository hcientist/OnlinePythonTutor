import cPickle
import doctest
import imp
import os
import sys

lines_to_skip = set()

stripped_filelines = []

if __name__ == "__main__":
    fullpath = sys.argv[1]
    assert fullpath.endswith(".py")

    # lifted from doctest.py
    # It is a module -- insert its dir into sys.path and try to
    # import it. If it is part of a package, that possibly
    # won't work because of package imports.
    dirname, filename = os.path.split(fullpath)
    sys.path.insert(0, dirname)
    m = __import__(filename[:-3]) # TODO: what about importing from a string -- exec'ing?
    del sys.path[0]
    dtf = doctest.DocTestFinder()
    tests = dtf.find(m)
    for t in tests:
        # splitlines doesn't work since it's sometimes off by one when
        # there's a trailing \n -- use split('\n') but remember to
        # ensure UNIX-style line endings!!!
        nlines = len(t.docstring.split('\n'))
        toskip = range(t.lineno, t.lineno + nlines)
        lines_to_skip.update(toskip)
        del t.globs # don't need it anyhow, and can't even serialize
        #print t.name, t.filename, t.lineno, nlines, lines_to_skip

    for i, line in enumerate(open(fullpath)):
        line = line.rstrip()
        if i not in lines_to_skip:
            stripped_filelines.append(line)

    stripped_filestr = '\n'.join(stripped_filelines)
    tests_pickled = cPickle.dumps(tests)


    # test only for injecting stuff BACK into student code
    loaded_tests = cPickle.loads(tests_pickled)

    # TEST student code, load from a STRING
    fullpath = sys.argv[2]
    assert fullpath.endswith(".py")

    # http://code.activestate.com/recipes/82234-importing-a-dynamically-generated-module/
    student_code_str = open(fullpath).read()
    student_module = imp.new_module('labtiny')
    exec student_code_str in student_module.__dict__
    #print student_module.slow_multiply.__module__
    #print student_module.slow_multiply.__name__
    student_module.slow_multiply.__doc__ = loaded_tests[1].docstring

    dtf2 = doctest.DocTestFinder()
    student_tests = dtf2.find(m)
    for t in student_tests:
        print t, t.examples
