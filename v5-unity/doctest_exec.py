import doctest
import json
import pg_logger
import os
import sys

def my_finalizer(input_code, output_trace):
  ret = dict(code=input_code, trace=output_trace)
  print(ret)
  #json_output = json.dumps(ret, indent=None) # use indent=None for most compact repr
  #print(json_output)

'''
raw_input_json = None
options_json = None

g = None
pg_logger.exec_script_str(user_script, None, None, my_finalizer, custom_globals=g)
'''


if __name__ == "__main__":
    filename = sys.argv[1]
    assert filename.endswith(".py")

    # lifted from doctest.py
    # It is a module -- insert its dir into sys.path and try to
    # import it. If it is part of a package, that possibly
    # won't work because of package imports.
    dirname, filename = os.path.split(filename)
    sys.path.insert(0, dirname)
    m = __import__(filename[:-3])
    del sys.path[0]
    dtf = doctest.DocTestFinder()
    tests = dtf.find(m)
    for t in tests:
        globs = t.globs
        #t.name
        #t.filename
        #t.docstring
        #r = doctest.DocTestRunner()
        #r.run(t, clear_globs=False)
        #r.summarize(verbose=True)
        for e in t.examples:
            print e.source
            #exec compile(e.source, filename, "single") in globs # works!

            # doesn't work :/ -- maybe resource restrictions?
            #pg_logger.exec_script_str(e.source, None, None, my_finalizer,
            #                          custom_globals=globs)

            # works!
            pg_logger.exec_script_str_local(e.source, False, False, False, my_finalizer, custom_globals=globs)

            #pg_logger.exec_script_str(e.source, None, None, my_finalizer)
        print
