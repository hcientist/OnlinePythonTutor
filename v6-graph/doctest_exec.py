'''
Input:

- sys.argv[1] - filename of a doctest pickle file like lab1_doctests.pickle
- sys.argv[2] - full name of the test, including the module name (e.g., 'lab1.multiply')
- sys.argv[3] - a zero-indexed integer to run the example at a specific index in the list,
                or 'all' to run all examples for this test (NOT IMPLEMENTED YET)
- sys.argv[4] - a string containing the student's code to be run with the test
- sys.argv[5] - [optional] a string representing a JSON list of strings of
                expressions whose values should be probed at each execution step

Output:

- a JSON representation of the result of running the given example, or a
  JSON string representing an error

'''

'''
TODOs

- are people going to brush up against the 1000-instruction execution
  limit? maybe raise that limit more?

- how do we handle parse/compile errors?

'''

import pickle
import imp
import json
import sys
import pg_logger
from doctest_reader import encode_doctest
import traceback

import pprint
pp = pprint.PrettyPrinter()


def opt_run_doctest(doctest, example_number, student_code, probe_exprs):
    def my_finalizer(input_code, output_trace):
        ret = dict(doctest=encode_doctest(doctest),
                   example_number=example_number,
                   student_code=student_code,
                   opt_trace=output_trace)
        json_output = json.dumps(ret, indent=None) # use indent=None, indent=2 for debugging
        print(json_output)
        #pp.pprint(output_trace) # for debugging


    def opt_doctest_exec_script_str(script_str, custom_modules):
        logger = pg_logger.PGLogger(False, False, False, my_finalizer,
                                  disable_security_checks=False,
                                  custom_modules=custom_modules,
                                  separate_stdout_by_module=True,
                                  probe_exprs=probe_exprs)
        try:
            logger._runscript(script_str)
        except bdb.BdbQuit:
            pass
        finally:
            return logger.finalize()

    module_name = doctest.name.split('.')[0] # grab the module part out of the test's name
    if example_number != 'all':
        try:
            assert 0 <= example_number < len(doctest.examples)
        except AssertionError:
            print(json.dumps("ERROR - example_number " + str(example_number) + " out of bounds for test " + doctest.name)) # print JSON to stdout
            traceback.print_exc()
            sys.exit(1)
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

    if len(sys.argv) > 5:
        probe_exprs = json.loads(sys.argv[5])
    else:
        probe_exprs = None

    if example_number != 'all':
        example_number = int(example_number)

    try:
        assert fullpath.endswith(".pickle")
        with open(fullpath, 'rU') as f: # use 'U' to work on Windows
            tests = pickle.load(f)

            found = False
            for t in tests:
                # run this test!
                if t.name == test_name:
                    opt_run_doctest(t, example_number, student_code, probe_exprs)
                    found = True
                    break
            if not found:
                print(json.dumps("ERROR - test not found: " + test_name)) # print JSON to stdout
                sys.exit(1)
    except SystemExit as e:
        pass
    except:
        print(json.dumps("ERROR - invalid lab pickle file: " + fullpath)) # print JSON to stdout
        traceback.print_exc()
