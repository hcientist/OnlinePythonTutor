''' 
A simple framework for regression testing based on golden files
by Philip Guo
'''

# find all input files with extension INPUT_FILE_EXTENSION in TESTDIRS
TESTDIRS = ['tests/']
INPUT_FILE_EXTENSION = '.rb'

# program to run, with input file as an extra argument
PROGRAM = ['./ruby', 'pg_logger.rb', '-f']

# this program should output to stdout, which will be redirected to this
# extension:
OUTPUT_FILE_EXTENSION = '.out'

# extension for golden files:
GOLDEN_FILE_EXTENSION = '.golden'


import itertools
import os, re, shutil, optparse, difflib
from subprocess import *

RED   = '\033[91m'
ENDC  = '\033[0m'  # end color

import re
memaddr_RE = re.compile('0x[0-9a-f]+')

# canonicalize all object IDs, such as "206":
# since they sometimes vary across executions due to different memory
# layout and such
objid_RE = re.compile('"\d+":')

# also canonicalize the corresponding reference IDs, such as "REF",\n386
# (but note that this must be run on all lines together, not just
# individual lines, since it spans two lines)
objrefid_RE = re.compile('"REF",\s+\d+')

def filter_output(lines):
  # substitute memory addresses with 0xADDR to prevent spurious diffs
  x = [memaddr_RE.sub('0xADDR', s) for s in lines]
  x = [objid_RE.sub('"ID":', s) for s in x]

  # hack: string it all together into one giant string before doing a
  # multi-line comparison
  fullstr = ''.join(x) # don't need an extra newline since all lines are already separated by newline chars
  fullstr = objrefid_RE.sub('"REF", ID', fullstr)
  ret = fullstr.split('\n') # split again to get a list of lines
  return ret


def execute(input_filename):
  assert os.path.isfile(input_filename)
  (base, ext) = os.path.splitext(input_filename)
  assert ext == INPUT_FILE_EXTENSION

  (stdout, stderr) = Popen(PROGRAM + [input_filename], stdout=PIPE, stderr=PIPE).communicate()

  if stderr:
    print '(has stderr)'
  #  print '  stderr {'
  #  print stderr, '}'
  else:
    print

  # capture stdout into outfile, filtering out machine-specific addresses
  outfile = base + OUTPUT_FILE_EXTENSION
  outf = open(outfile, 'w')

  for line in stdout.splitlines():
    filtered_line = re.sub(' 0x.+?>', ' 0xADDR>', line)
    print >> outf, filtered_line

  outf.close()


def clobber_golden_file(golden_file):
  (base, ext) = os.path.splitext(golden_file)
  outfile = base + OUTPUT_FILE_EXTENSION
  assert os.path.isfile(outfile)
  print '  Clobber %s => %s' % (outfile, golden_file)
  shutil.copy(outfile, golden_file)


# returns True if there is a diff, False otherwise
def golden_differs_from_out(golden_file):
  (base, ext) = os.path.splitext(golden_file)
  outfile = base + OUTPUT_FILE_EXTENSION
  assert os.path.isfile(outfile)
  assert os.path.isfile(golden_file)

  golden_s = open(golden_file).readlines()
  out_s = open(outfile).readlines()

  golden_s_filtered = filter_output(golden_s)
  out_s_filtered = filter_output(out_s)

  return out_s_filtered != golden_s_filtered


# for sanity checking
def print_filtered_outfile(test_name):
  (base, ext) = os.path.splitext(test_name)
  outfile = base + OUTPUT_FILE_EXTENSION
  assert os.path.isfile(outfile)

  out_s = open(outfile).readlines()
  out_s_filtered = filter_output(out_s)
  for line in out_s_filtered:
    print line


def diff_test_output(test_name):
  (base, ext) = os.path.splitext(test_name)

  golden_file = base + GOLDEN_FILE_EXTENSION
  assert os.path.isfile(golden_file)
  outfile = base + OUTPUT_FILE_EXTENSION
  assert os.path.isfile(outfile)

  golden_s = open(golden_file).readlines()
  out_s = open(outfile).readlines()

  golden_s_filtered = filter_output(golden_s)
  out_s_filtered = filter_output(out_s)

  first_line = True
  for line in difflib.unified_diff(golden_s_filtered, out_s_filtered, \
                                   fromfile=golden_file, tofile=outfile):
    if first_line:
      print # print an extra line to ease readability
      first_line = False
    print line


def run_test(input_filename, clobber_golden=False):
  print 'Testing', input_filename,

  (base, ext) = os.path.splitext(input_filename)
  assert ext == INPUT_FILE_EXTENSION

  # to eliminate possibility of using stale output:
  outfile = base + OUTPUT_FILE_EXTENSION
  if os.path.isfile(outfile):
    os.remove(outfile)

  input_fullpath = input_filename
  execute(input_fullpath)

  golden_file = base + GOLDEN_FILE_EXTENSION
  if os.path.isfile(golden_file):
    if golden_differs_from_out(golden_file):
      print "  " + RED + "FAILED!!!" + ENDC
    if clobber_golden:
      clobber_golden_file(golden_file)
  else:
    clobber_golden_file(golden_file)


def run_all_tests(clobber=False):
  for t in ALL_TESTS:
    run_test(t, clobber)

def diff_all_test_outputs():
  for t in ALL_TESTS:
    diff_test_output(t)


if __name__ == "__main__":
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
                    help="Diff against golden file for one test")
  parser.add_option("--print-filtered-output", dest="print_test_name",
                    help="Print the filtered output for one test")
  parser.add_option("--diffall", action="store_true", dest="diff_all",
                    help="Diff against golden file for all tests")
  (options, args) = parser.parse_args()

  ALL_TESTS = []

  for (pwd, subdirs, files) in itertools.chain(*[os.walk(e) for e in TESTDIRS]):
    for f in files:
      (base, ext) = os.path.splitext(f)
      if ext == INPUT_FILE_EXTENSION:
        fullpath = os.path.join(pwd, f)
        ALL_TESTS.append(fullpath)


  if options.run_all:
    if options.clobber:
      print 'Running all tests and clobbering results ...'
    else:
      print 'Running all tests ...'
    run_all_tests(options.clobber)

  elif options.diff_all:
    diff_all_test_outputs()
  elif options.print_test_name:
    assert options.print_test_name in ALL_TESTS
    print_filtered_outfile(options.print_test_name)
  elif options.diff_test_name:
    assert options.diff_test_name in ALL_TESTS
    diff_test_output(options.diff_test_name)
  elif options.test_name:
    assert options.test_name in ALL_TESTS
    run_test(options.test_name, options.clobber)
  elif options.only_clobber:
    for t in ALL_TESTS:
      (base, ext) = os.path.splitext(t)
      golden_file = base + GOLDEN_FILE_EXTENSION
      clobber_golden_file(golden_file)
  else:
    parser.print_help()

