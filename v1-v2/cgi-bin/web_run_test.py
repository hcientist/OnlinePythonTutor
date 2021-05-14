#!/usr/bin/python2.6

# Online Python Tutor
# https://github.com/pgbovine/OnlinePythonTutor/
# 
# Copyright (C) 2010-2012 Philip J. Guo (philip@pgbovine.net)
# 
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
# 
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
# CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


# Runs both 'user_script' and 'expect_script' and returns whether the
# test has passed or failed, along with the FULL trace if the test has
# failed (so that the user can debug it)


import cgi
import pg_logger

import json

user_trace = None # the FULL user trace (without any IDs, though)
expect_trace_final_entry = None

def user_script_finalizer(output_lst):
  # very important!
  global user_trace, expect_trace_final_entry

  user_trace = output_lst

  # dunno which order these events come in ...
  if user_trace and expect_trace_final_entry:
    really_finalize()


def expect_script_finalizer(output_lst):
  # very important!
  global user_trace, expect_trace_final_entry

  expect_trace_final_entry = output_lst[-1]

  # if there's an error here, bail NOW and return an error
  if (expect_trace_final_entry['event'] != 'return' or \
      expect_trace_final_entry['func_name'] != '<module>'):
    ret = {}
    ret['status'] = 'error'
    ret['error_msg'] = "Fatal error: expected output is malformed!"

    # Crucial first line to make sure that Apache serves this data
    # correctly - DON'T FORGET THE EXTRA NEWLINES!!!:
    print "Content-type: text/plain; charset=iso-8859-1\n\n"
    output_json = json.dumps(ret)
    print output_json

  else:
    # dunno which order these events come in ...
    if user_trace and expect_trace_final_entry:
      really_finalize()


def really_finalize():
  # Procedure for grading testResults vs. expectResults:
  # - The final line in expectResults should be a 'return' from
  #   '<module>' that contains only ONE global variable.  THAT'S
  #   the variable that we're gonna compare against testResults.

  vars_to_compare = expect_trace_final_entry['globals'].keys()
  if len(vars_to_compare) != 1:
    ret['status'] = 'error'
    ret['error_msg'] = "Fatal error: expected output has more than one global var!"
  else:
    single_var_to_compare = vars_to_compare[0]

    user_trace_final_entry = user_trace[-1]

    ret = {}
    ret['status'] = 'ok'
    ret['passed_test'] = False
    ret['output_var_to_compare'] = single_var_to_compare

    # Grab the 'inputs' by finding all global vars that are in scope
    # prior to making the first function call.
    #
    # NB: This means that you can't call any functions to initialize
    # your input data, since the FIRST function call must be the function
    # that you're testing.
    for e in user_trace:
      if e['event'] == 'call':
        ret['input_globals'] = e['globals']
        break

    # always fetch expect_val
    ret['expect_val'] = expect_trace_final_entry['globals'][single_var_to_compare]

    if user_trace_final_entry['event'] == 'return': # normal termination
      if single_var_to_compare not in user_trace_final_entry['globals']:
        ret['status'] = 'error'
        ret['error_msg'] = "Error: output has no global var named '%s'" % (single_var_to_compare,)
      else:
        ret['test_val'] = user_trace_final_entry['globals'][single_var_to_compare]

        # do the actual comparison here!
        if ret['expect_val'] == ret['test_val']:
          ret['passed_test'] = True

    else:
      ret['status'] = 'error'
      ret['error_msg'] = user_trace_final_entry['exception_msg']


  # Crucial first line to make sure that Apache serves this data
  # correctly - DON'T FORGET THE EXTRA NEWLINES!!!:
  print "Content-type: text/plain; charset=iso-8859-1\n\n"
  output_json = json.dumps(ret)
  print output_json


form = cgi.FieldStorage()
user_script = form['user_script'].value
expect_script = form['expect_script'].value

# WEIRD: always run the expect_script FIRST since it's less likely to have
# errors.  for some mysterious reason, if there's an error in user_script,
# then it will never run expect_script
#
# also make sure to ignore IDs so that we can do direct object comparisons!
pg_logger.exec_script_str(expect_script, expect_script_finalizer, ignore_id=True)


# set a custom instruction limit only for user scripts ...
if 'max_instructions' in form:
  pg_logger.set_max_executed_lines(int(form['max_instructions'].value))

pg_logger.exec_script_str(user_script, user_script_finalizer, ignore_id=True)
