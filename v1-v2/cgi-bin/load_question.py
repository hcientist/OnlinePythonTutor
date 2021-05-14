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


# Load a question file in the 'questions/' sub-directory, parse it,
# and return it to the caller in JSON format
QUESTIONS_DIR = '../questions/'

from parse_questions import parseQuestionsFile

import cgi, os, json

form = cgi.FieldStorage()
question_file = form['question_file'].value

fn = QUESTIONS_DIR + question_file + '.txt'
assert os.path.isfile(fn)


# Crucial first line to make sure that Apache serves this data
# correctly - DON'T FORGET THE EXTRA NEWLINES!!!:
print "Content-type: text/plain; charset=iso-8859-1\n\n"
print json.dumps(parseQuestionsFile(fn))
