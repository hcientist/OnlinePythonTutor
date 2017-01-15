'''
Input:

- sys.argv[1] - filename of a doctest pickle file like lab1_doctests.pickle
- sys.argv[2] - full name of the test, including the module name (e.g., 'lab1.multiply')
- sys.argv[3] - a zero-indexed integer to run the example at a specific index in the list,
                or 'all' to run all examples for this test (NOT IMPLEMENTED YET)
- sys.argv[4] - a string containing the student's code to be run with the test

Output:

- a JSON representation of the result of running the given example

'''

'''
TODOs

- are people going to brush up against the 1000-instruction execution
  limit? maybe raise that limit more?

'''

import cPickle
import imp
import json
import sys
import pg_logger
from doctest_reader import encode_doctest

import pprint
pp = pprint.PrettyPrinter()


def opt_run_doctest(doctest, example_number, student_code):
    def my_finalizer(input_code, output_trace):
        ret = dict(doctest=encode_doctest(doctest),
                   example_number=example_number,
                   student_code=student_code,
                   opt_trace=output_trace)
        json_output = json.dumps(ret, indent=None) # use indent=None, indent=2 for debugging
        #print(json_output)
        pp.pprint(output_trace)


    def opt_doctest_exec_script_str(script_str, custom_modules):
        logger = pg_logger.PGLogger(False, False, False, my_finalizer,
                                  disable_security_checks=False,
                                  custom_modules=custom_modules,
                                  separate_stdout_by_module=True)
        try:
            logger._runscript(script_str)
        except bdb.BdbQuit:
            pass
        finally:
            return logger.finalize()

    module_name = doctest.name.split('.')[0] # grab the module part out of the test's name
    if example_number != 'all':
        assert 0 <= example_number < len(doctest.examples)
        # run a single example
        example_to_run = doctest.examples[example_number]
        opt_doctest_exec_script_str(example_to_run.source,
                                    custom_modules={module_name: student_code})
    else:
        raise NotImplementedError # not implemented yet!


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
