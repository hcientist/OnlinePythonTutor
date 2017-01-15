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
- return success/failure/errors/etc.

- because doctests are based on stdout and not semantic value checking ...
    - there is an ambiguity between 'return-ing' stuff and printing stuff to
      the terminal. right now if students try to print, it will return None
      and print an extra None, which could be confusing
    - when students are trying to do printf-debugging inside of their
      functions, they will *always* get test failures since doctests are based
      on prints, not actual return values. hmmm, how do we fix this?!?
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
    #student_module = imp.new_module(module_name)
    #exec student_code in student_module.__dict__
    #student_globals = student_module.__dict__

    if example_number != 'all':
        assert 0 <= example_number < len(t.examples)
        # run a single example
        example_to_run = t.examples[example_number]
        #print example_to_run.source

        #exec compile(example_to_run.source, module_name, "single") in student_globals
        opt_doctest_exec_script_str(example_to_run.source,
                                    my_finalizer,
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

def opt_doctest_exec_script_str(script_str, finalizer_func, custom_modules):
  logger = pg_logger.PGLogger(False, False, False, finalizer_func,
                              disable_security_checks=False,
                              custom_modules=custom_modules)
  try:
    logger._runscript(script_str)
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

