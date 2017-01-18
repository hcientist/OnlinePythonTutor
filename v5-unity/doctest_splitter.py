'''
Input:

- sys.argv[1] - filename of a Python file in a Labyrinth lab format (e.g., lab1.py)

Outputs (if you pass in, say, lab1.py to this script):
- lab1_skeleton.py - a skeleton lab1.py file with all docstrings stripped out
- lab1_doctests.pickle - a pickle file containing a list of doctest.DocTest
                         objects extracted from lab1.py
  - the first element of this list contains the docstring for the top-level
    module (which you can parse to get a lab overview description); all
    remaining elements are docstrings for functions

'''

import pickle
import doctest
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
    bn, ext = os.path.splitext(filename)
    m = __import__(filename[:-3])
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

    with open(bn + '_skeleton.py', 'w') as f:
        stripped_filestr = '\n'.join(stripped_filelines)
        f.write(stripped_filestr)
        print "Created", bn + '_skeleton.py'
    with open(bn + '_doctests.pickle', 'w') as f:
        pickle.dump(tests, f, protocol=0) # use protocol=0 to work on Windows
        print "Created", bn + '_doctests.pickle'
