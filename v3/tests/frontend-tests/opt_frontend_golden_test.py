''' 
Golden tests for OPT frontend JS rendering
Created on 2014-04-21

Pre-reqs:
    phantomjs installed (tested on v1.9.2)
    OPT running locally on localhost:8080 using "python bottle_server.py"
    must run from the current directory

TODO:
    for fuzzy image diffing, consider:
    http://www.imagemagick.org/Usage/compare/

---

Forked from ../golden_test.py

A simple framework for regression testing based on golden files
by Philip Guo

(sloppily) customized for the Online Python Tutor project
'''

# test with different display options
OPTIONS_DICT = {
  'regular': 'cumulative=false&heapPrimitives=false&drawParentPointers=false&textReferences=false&py=2',
  'csc108h': 'cumulative=false&heapPrimitives=true&drawParentPointers=false&textReferences=true&py=2',
  'composingprograms': 'cumulative=true&heapPrimitives=false&drawParentPointers=false&textReferences=false&py=3',
}

import os, re, shutil, optparse, filecmp
from subprocess import *

RED   = '\033[91m'
ENDC  = '\033[0m'  # end color


def execute(input_filename, option_name):
  assert os.path.isfile(input_filename)
  (base, ext) = os.path.splitext(input_filename)
  assert ext == INPUT_FILE_EXTENSION

  (stdout, stderr) = Popen(PROGRAM + [input_filename, 'localhost:8080', OPTIONS_DICT[option_name]],
                           stdout=PIPE, stderr=PIPE).communicate()


def clobber_golden_file(outfile, golden_file):
  print '  Clobber %s => %s' % (outfile, golden_file)
  shutil.copy(outfile, golden_file)


def run_test(input_filename, clobber_golden=False):
    print 'Testing', input_filename
    bn = os.path.basename(input_filename)

    # test all frontend display options
    for option in OPTIONS_DICT:
        print "  " + option
        execute(input_filename, option)

        output_png_files = [e for e in os.listdir('.') if bn + '.step.' in e]
        for e in output_png_files:
            golden_file = 'golden-files/' + option + '/' + e

            if os.path.isfile(golden_file):
                if not filecmp.cmp(e, golden_file):
                    print "    " + RED + e + " differs, moved to failed-tests/" + ENDC

                    # save it under a new name so it won't be deleted
                    # at the end of this function call
                    newname = e + '.' + option + '.png'
                    os.rename(e, 'failed-tests/' + newname)
                if clobber_golden:
                    clobber_golden_file(e, golden_file)
            else:
                clobber_golden_file(e, golden_file)

    # do a crude cleanup pass at the very end of the test
    # to not interfere as much with Dropbox's weird behavior
    for e in os.listdir('.'):
        if '.step.' in e:
            os.remove(e)


def run_all_tests(clobber=False):
  for t in ALL_TESTS:
    run_test(t, clobber)


if __name__ == "__main__":
  parser = optparse.OptionParser()
  parser.add_option("--all", action="store_true", dest="run_all",
                    help="Run all tests")
  parser.add_option("--clobber", action="store_true", dest="clobber",
                    help="Clobber golden files when running tests")
  parser.add_option("--test", dest="test_name",
                    help="Run one test")
  (options, args) = parser.parse_args()

  INPUT_FILE_EXTENSION = '.txt' # input test files are .txt, NOT .py

  PROGRAM = ['phantomjs', '../../screenshot-renderer/render-opt-screenshots.js']

  # grab a representative subset of backend tests
  # don't need ALL of them since they run way too slowly
  ALL_TESTS = ['../example-code/aliasing.txt',
               '../example-code/fact.txt',
               '../example-code/filter.txt',
               '../example-code/aliasing/aliasing8.txt',
               '../example-code/oop_inherit.txt',
               '../example-code/linked-lists/ll1.txt',
               '../example-code/sum-list.txt',
               '../example-code/closures/closure3.txt',
               ]

  if options.run_all:
    if options.clobber:
      print 'Running all tests and clobbering results ...'
    else:
      print 'Running all tests ...'
    run_all_tests(options.clobber)
  elif options.test_name:
    assert options.test_name in ALL_TESTS
    run_test(options.test_name, options.clobber)
  else:
    parser.print_help()

