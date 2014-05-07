''' 
Golden tests for OPT frontend JS rendering
Created on 2014-04-21

Pre-reqs:
- phantomjs installed (tested on v1.9.2)
- ImageMagick installed to do fuzzy image diffing
  (tested on Version: ImageMagick 6.8.8-3 Q16 x86_64 2014-01-12 http://www.imagemagick.org)
  http://www.imagemagick.org/Usage/compare/
- OPT running locally on localhost:8080 using "python bottle_server.py"
- execute from the current directory

---
Forked from ../golden_test.py

A simple framework for regression testing based on golden files
by Philip Guo

(sloppily) customized for the Online Python Tutor project
'''

# test with different display options
'''
HTML_DICT = {
  'regular': 'visualize.html',
  'csc108h': 'csc108h.html',
  'composingprograms': 'composingprograms.html',
}
'''

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

  args = [input_filename, 'localhost:8080', 'visualize.html', OPTIONS_DICT[option_name]]
  (stdout, stderr) = Popen(PROGRAM + args,
                           stdout=PIPE, stderr=PIPE).communicate()


def clobber_golden_file(outfile, golden_file):
  print '  Clobber %s => %s' % (outfile, golden_file)
  shutil.copy(outfile, golden_file)

# trivial EXACT FILE MATCH comparison, which works only if you're
# running on the exact same machine!
'''
def png_files_differ(f1, f2):
    return not filecmp.cmp(f1, f2)
'''

# fuzzy image comparison using ImageMagick
# see: http://www.imagemagick.org/Usage/compare/
# compare -metric AE -fuzz 1% aliasing.txt.step.2.png.regular.png  ../golden-files/regular/aliasing.txt.step.3.png -compose src -highlight-color White -lowlight-color Black cmp.png
DIFF_PNG = '/tmp/diff.png'
def png_files_differ(f1, f2):

    # adjust fuzz to a higher percentage if it's not sensitive enough
    # /tmp/diff.png shows pixel differences,
    # and the number of differed pixels is sent to stderr
    cmdline = ['compare', '-metric', 'AE', '-fuzz', '3%',
               f1, f2,
               '-compose', 'src', '-highlight-color', 'White',
               '-lowlight-color', 'Black', DIFF_PNG]
    (stdout, stderr) = Popen(cmdline, stdout=PIPE, stderr=PIPE).communicate()
    assert stderr
    if 'image widths or heights differ' in stderr:
        if os.path.isfile(DIFF_PNG):
            os.remove(DIFF_PNG)
        return True
    else:
        num_pixels_diff = int(stderr)
        return num_pixels_diff != 0


def run_test(input_filename, clobber_golden=False):
    try:
        print 'Testing', input_filename
        bn = os.path.basename(input_filename)

        # test all frontend display options
        for option in OPTIONS_DICT:
            print "  " + option
            execute(input_filename, option)

            output_png_files = [e for e in os.listdir('.') if bn + '.step.' in e]
            if not output_png_files:
                print "    " + RED + "no output .png files, maybe server is down?" + ENDC
                

            for e in output_png_files:
                golden_file = 'golden-files/' + option + '/' + e

                if os.path.isfile(golden_file):
                    if png_files_differ(e, golden_file):
                        print "    " + RED + e + " differs, moved to failed-tests/" + ENDC

                        # save it under a new name in failed-tests/
                        newname = 'failed-tests/' + os.path.splitext(e)[0] + '.' + option + '.png'
                        os.rename(e, newname)
                        # ... and the diff too, if it exists:
                        if os.path.isfile(DIFF_PNG):
                            os.rename(DIFF_PNG, os.path.splitext(newname)[0] + '.diff.png')

                        if clobber_golden:
                            clobber_golden_file(newname, golden_file)
                else:
                    clobber_golden_file(e, golden_file)

    finally:
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
               'basic-data-structures.py',
               'criss-cross.py',
               'binary-tree.py',
               'circular.py',
               'double-nudge.py',
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

