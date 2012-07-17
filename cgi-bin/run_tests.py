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


# Regression tests for Online Python Tutor back-end
#
# Run using:
#   python run_tests.py --all

import os, sys, re, shutil, filecmp, optparse, difflib
import pg_logger


# all tests are found in this directory:
REGTEST_DIR = '../test-programs/'

ALL_TESTS = [e for e in os.listdir(REGTEST_DIR) if e.endswith('.py')]

# return True if there seemed to be an error in execution
def execute(test_script):
  def my_finalizer(output_lst):
    outfile = open(test_script[:-3] + '.out', 'w')
    output_json = json.dumps(output_lst)
    print >> outfile, output_json

  pg_logger.exec_script_str(open(test_script).read(), my_finalizer, True)


def clobber_golden_file(golden_file):
  print '  Overriding golden file'
  outfile = golden_file.replace('.golden', '.out')
  assert os.path.isfile(outfile)
  shutil.copy(outfile, golden_file)


# returns True if there is a diff, False otherwise
def diff_test_golden_data(golden_file):
  outfile = golden_file.replace('.golden', '.out')
  assert os.path.isfile(outfile)
  assert os.path.isfile(golden_file)

  # filter out machine-specific memory addresses:
  outfile_filtered = \
    [re.sub(' 0x.+?>', ' 0xADDR>', e) for e in open(outfile).readlines()]
  golden_file_filtered = \
    [re.sub(' 0x.+?>', ' 0xADDR>', e) for e in open(golden_file).readlines()]

  return outfile_filtered != golden_file_filtered


def diff_test_output(test_name):
  golden_file = test_name[:-3] + '.golden'
  assert os.path.isfile(golden_file)

  outfile = golden_file.replace('.golden', '.out')
  assert os.path.isfile(outfile)

  golden_s = open(golden_file).readlines()
  out_s = open(outfile).readlines()

  golden_s_filtered = [re.sub(' 0x.+?>', ' 0xADDR>', e) for e in golden_s]
  out_s_filtered = [re.sub(' 0x.+?>', ' 0xADDR>', e) for e in out_s]

  for line in difflib.unified_diff(golden_s_filtered, out_s_filtered, \
                                   fromfile=golden_file, tofile=outfile):
    print line,


def run_test(test_name, clobber_golden=False):
  print 'Testing', test_name
  assert test_name.endswith('.py')
  outfile = test_name[:-3] + '.out'
  if os.path.isfile(outfile):
    os.remove(outfile)

  try:
    execute(test_name)
  except:
    pass

  golden_file = test_name[:-3] + '.golden'
  if os.path.isfile(golden_file):
    if diff_test_golden_data(golden_file):
      print "  FAILED"
    if clobber_golden:
      clobber_golden_file(golden_file)
  else:
    clobber_golden_file(golden_file)


def run_all_tests(clobber=False):
  for t in ALL_TESTS:
    run_test(t, clobber)

def diff_all_test_outputs():
  for t in ALL_TESTS:
    print '=== diffing', t, '==='
    diff_test_output(t)


if __name__ == "__main__":
  os.chdir(REGTEST_DIR) # change to this dir to make everything easier

  parser = optparse.OptionParser()
  parser.add_option("--all", action="store_true", dest="run_all",
                    help="Run all tests")
  parser.add_option("--only-clobber", action="store_true", dest="only_clobber",
                    help="Clobber ALL golden files WITHOUT re-running tests")
  parser.add_option("--clobber", action="store_true", dest="clobber",
                    help="Clobber golden files when running tests")
  parser.add_option("--test", dest="test_name",
                    help="Run one test")
  parser.add_option("--difftest", dest="diff_test_name",
                    help="Diff against .golden for one test")
  parser.add_option("--diffall", action="store_true", dest="diff_all",
                    help="Diff against .golden for all tests")
  (options, args) = parser.parse_args()
  if options.run_all:
    if options.clobber:
      print 'Running all tests and clobbering results ...'
    else:
      print 'Running all tests ...'
    run_all_tests(options.clobber)

  elif options.diff_all:
    diff_all_test_outputs()
  elif options.diff_test_name:
    diff_test_output(options.diff_test_name)
  elif options.test_name:
    run_test(options.test_name, options.clobber)
  elif options.only_clobber:
    for t in ALL_TESTS:
      golden_file = t[:-3] + '.golden'
      clobber_golden_file(golden_file)
  else:
    parser.print_help()

