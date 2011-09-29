#!/usr/bin/python2.5

# Online Python Tutor
# Copyright (C) 2010 Philip J. Guo (philip@pgbovine.net)
# https://github.com/pgbovine/OnlinePythonTutor/
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.


# Runs both 'user_script' and 'expect_script' and returns whether the
# test has passed or failed, along with the FULL trace if the test has
# failed (so that the user can debug it)


import cgi
import pg_logger

# Python 2.5 doesn't have a built-in json module, so I'm using a
# 3rd-party module.  I think you can do 'import json' in Python >= 2.6
import demjson

user_trace = None # the FULL user trace (without any IDs, though)
expect_trace_final_entry = None

def user_script_finalizer(output_lst):
  # very important!
  global user_trace
  global expect_trace_final_entry

  user_trace = output_lst

  # dunno which order these events come in ...
  if user_trace and expect_trace_final_entry:
    really_finalize()


def expect_script_finalizer(output_lst):
  # very important!
  global user_trace
  global expect_trace_final_entry

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
    output_json = demjson.encode(ret, compactly=True)
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

    assert single_var_to_compare
    ret['var_to_compare'] = single_var_to_compare

    if user_trace_final_entry['event'] == 'return': # regular termination
      if single_var_to_compare not in user_trace_final_entry['globals']:
        ret['status'] = 'error'
        ret['error_msg'] = "Error: output has no global var named '%s'" % (single_var_to_compare,)
      else:
        expect_val = expect_trace_final_entry['globals'][single_var_to_compare]
        test_val   = user_trace_final_entry['globals'][single_var_to_compare]

        ret['test_val'] = expect_val
        ret['expect_val'] = expect_val

        # do the actual comparison here!
        if expect_val == test_val:
          ret['passed_test'] = True

        # find the INITIAL value of single_var_to_compare by finding its
        # FIRST occurrence in user_trace
        #
        # NB: This means that the initialization code for the input can
        # only span ONE instruction.  i.e., it must be a primitive
        # literal assignment and not a data structure that's built up
        # incrementally over several steps.
        for e in user_trace:
          if 'globals' in e and single_var_to_compare in e['globals']:
            ret['input_val'] = e['globals'][single_var_to_compare]
            break # BREAK AFTER FIRST MATCH!!!

    else:
      ret['status'] = 'error'
      ret['error_msg'] = user_trace_final_entry['exception_msg']


  # Crucial first line to make sure that Apache serves this data
  # correctly - DON'T FORGET THE EXTRA NEWLINES!!!:
  print "Content-type: text/plain; charset=iso-8859-1\n\n"
  output_json = demjson.encode(ret, compactly=True)
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
pg_logger.exec_script_str(user_script, user_script_finalizer, ignore_id=True)

