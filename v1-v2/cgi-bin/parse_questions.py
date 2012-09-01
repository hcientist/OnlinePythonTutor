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


# Defines a function that parses an Online Python Tutor 'questions file'
# into a dict, which can easily be converted into JSON

import os, sys

delimiters = set(['Name:', 'Question:', 'Hint:', 'Solution:',
'Skeleton:', 'Test:', 'Expect:'])

def parseQuestionsFile(filename):
  ret = {}
  ret['tests'] = []
  ret['expects'] = []

  curParts = []
  curDelimiter = None

  def processRecord():
    if curDelimiter == 'Name:':
      ret['name'] = '\n'.join(curParts).strip()
    elif curDelimiter == 'Question:':
      ret['question'] = ' '.join(curParts).strip()
    elif curDelimiter == 'Hint:':
      ret['hint'] = ' '.join(curParts).strip()
    elif curDelimiter == 'Solution:':
      ret['solution'] = ' '.join(curParts).strip()
    elif curDelimiter == 'Skeleton:':
      ret['skeleton'] = '\n'.join(curParts).strip()
    elif curDelimiter == 'Test:':
      ret['tests'].append('\n'.join(curParts).strip())
    elif curDelimiter == 'Expect:':
      ret['expects'].append('\n'.join(curParts).strip())


  for line in open(filename):
    # only strip TRAILING spaces and not leading spaces
    line = line.rstrip()

    # comments are denoted by a leading '//', so ignore those lines.
    # Note that I don't use '#' as the comment token since sometimes I
    # want to include Python comments in the skeleton code.
    if line.startswith('//'):
      continue

    # special-case one-liners:
    if line.startswith('MaxLineDelta:'):
      ret['max_line_delta'] = int(line.split(':')[1])
      continue # move to next line

    if line.startswith('MaxInstructions:'):
      ret['max_instructions'] = int(line.split(':')[1])
      continue # move to next line


    if line in delimiters:
      processRecord()
      curDelimiter = line
      curParts = []
    else:
      curParts.append(line)

  # don't forget to process the FINAL record
  processRecord()

  assert len(ret['tests']) == len(ret['expects'])

  return ret


if __name__ == '__main__':
  import pprint
  pp = pprint.PrettyPrinter(indent=2)
  pp.pprint(parseQuestionsFile(sys.argv[1]))
