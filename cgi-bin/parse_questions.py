# Online Python Tutor
# Copyright (C) 2010 Philip J. Guo
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

  curParts = []
  curDelimiter = None

  tests = []
  expects = []

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
      tests.append('\n'.join(curParts).strip())
    elif curDelimiter == 'Expect:':
      expects.append('\n'.join(curParts).strip())


  for line in open(filename):
    # only strip TRAILING spaces and not leading spaces
    line = line.rstrip()

    if line in delimiters:
      processRecord()
      curDelimiter = line
      curParts = []
    else:
      curParts.append(line)

  processRecord()

  ret['tests'] = tests
  ret['expects'] = expects

  return ret


if __name__ == '__main__':
  import pprint
  pp = pprint.PrettyPrinter(indent=2)
  pp.pprint(parseQuestionsFile(sys.argv[1]))
