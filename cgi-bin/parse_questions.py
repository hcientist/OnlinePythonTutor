# Online Python Tutor
# Copyright (C) 2010-2011 Philip J. Guo (philip@pgbovine.net)
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
