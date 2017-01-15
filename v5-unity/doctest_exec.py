'''
Input:

- sys.argv[1] - filename of a doctest pickle file like lab1_doctests.pickle
- sys.argv[2] - full name of the test, including the module name (e.g., 'lab1.multiply')
- sys.argv[3] - a zero-indexed integer to run the example at a specific index in the list,
                or 'all' to run all examples for this test (NOT IMPLEMENTED YET)
- sys.argv[4] - a string containing the student's code to be run with the test

Output:

- a JSON representation of the result of running those tests

'''

'''
TODOs
- get it running *with* security checks
- return success/failure/errors/etc.
'''

import cPickle
import imp
import json
import sys
import pg_logger
import pprint

def opt_run_doctest(doctest, example_number, student_code):
    module_name = doctest.name.split('.')[0] # grab the module part out of the test's name

    # import student_code as a module
    # http://code.activestate.com/recipes/82234-importing-a-dynamically-generated-module/
    student_module = imp.new_module(module_name)
    exec student_code in student_module.__dict__

    student_globals = student_module.__dict__
    if example_number != 'all':
        assert 0 <= example_number < len(t.examples)
        # run a single example
        example_to_run = t.examples[example_number]
        #print example_to_run.source

        #exec compile(example_to_run.source, module_name, "single") in student_globals

        # doesn't work :/ -- maybe resource restrictions because
        # we're trying to use os functions in this file all over the place?
        #pg_logger.exec_script_str(e.source, None, None, my_finalizer,
        #                          custom_globals=globs)

        # works
        opt_doctest_exec_script_str(example_to_run.source,
                                    my_finalizer,
                                    custom_globals=student_globals,
                                    custom_modules={module_name: student_code})
    else:
        raise NotImplementedError # not implemented yet!
        #for e in t.examples:
        #    opt_run_doctest_example(t, e, student_code)
        pass


def my_finalizer(input_code, output_trace):
  #ret = dict(code=input_code, trace=output_trace)
  #json_output = json.dumps(output_trace, indent=2) # use indent=None for most compact repr
  #print(json_output)
  pp = pprint.PrettyPrinter()
  pp.pprint(output_trace)

# disables security check and returns the result of finalizer_func
# WARNING: ONLY RUN THIS LOCALLY and never over the web, since
# security checks are disabled
def opt_doctest_exec_script_str(script_str, finalizer_func, custom_globals, custom_modules):
  logger = pg_logger.PGLogger(False, False, False, finalizer_func,
                              disable_security_checks=True,
                              custom_modules=custom_modules)
  try:
    logger._runscript(script_str, custom_globals)
  except bdb.BdbQuit:
    pass
  finally:
    return logger.finalize()


if __name__ == "__main__":
    fullpath = sys.argv[1]
    test_name = sys.argv[2]
    example_number = sys.argv[3]
    student_code = sys.argv[4]
    if example_number != 'all':
        example_number = int(example_number)
        assert example_number >= 0
    assert fullpath.endswith(".pickle")
    with open(fullpath) as f:
        tests = cPickle.load(f)
        for t in tests:
            # run this test!
            if t.name == test_name:
                opt_run_doctest(t, example_number, student_code)
                break

sys.exit(0)


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
            # the 'single' mode produces the results to stdout, i think! ahhhhh
            '''
            https://docs.python.org/2/library/functions.html#compile

            The mode argument specifies what kind of code must be
            compiled; it can be 'exec' if source consists of a sequence
            of statements, 'eval' if it consists of a single expression,
            or 'single' if it consists of a single interactive statement
            (in the latter case, expression statements that evaluate to
            something other than None will be printed).
            '''
            #exec compile(e.source, filename, "single") in globs # works!

            # doesn't work :/ -- maybe resource restrictions because
            # we're trying to use os functions in this file all over the place?
            #pg_logger.exec_script_str(e.source, None, None, my_finalizer,
            #                          custom_globals=globs)

            # works!
            MY_exec_script_str_local(e.source, my_finalizer, custom_globals=globs)

            #pg_logger.exec_script_str(e.source, None, None, my_finalizer)
        print
