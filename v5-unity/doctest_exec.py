'''
TODOs
- get it running *with* security checks
- strip out doctest from code before running
'''

import doctest
import json
import pg_logger
import os
import sys

import pprint
pp = pprint.PrettyPrinter()

def my_finalizer(input_code, output_trace):
  ret = dict(code=input_code, trace=output_trace)
  pp.pprint(output_trace)
  #print(ret)
  #json_output = json.dumps(ret, indent=None) # use indent=None for most compact repr
  #print(json_output)


# disables security check and returns the result of finalizer_func
# WARNING: ONLY RUN THIS LOCALLY and never over the web, since
# security checks are disabled
def MY_exec_script_str_local(script_str, finalizer_func, custom_globals=None):
  logger = pg_logger.PGLogger(False, False, False, finalizer_func, disable_security_checks=True)
  try:
    logger._runscript(script_str, custom_globals)
  except bdb.BdbQuit:
    pass
  finally:
    return logger.finalize()


if __name__ == "__main__":
    filename = sys.argv[1]
    assert filename.endswith(".py")

    # lifted from doctest.py
    # It is a module -- insert its dir into sys.path and try to
    # import it. If it is part of a package, that possibly
    # won't work because of package imports.
    dirname, filename = os.path.split(filename)
    sys.path.insert(0, dirname)
    m = __import__(filename[:-3]) # TODO: what about importing from a string -- exec'ing?
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

            # doesn't work :/ -- maybe resource restrictions because
            # we're trying to use os functions in this file all over the place?
            #pg_logger.exec_script_str(e.source, None, None, my_finalizer,
            #                          custom_globals=globs)

            # works!
            MY_exec_script_str_local(e.source, my_finalizer, custom_globals=globs)

            #pg_logger.exec_script_str(e.source, None, None, my_finalizer)
        print
