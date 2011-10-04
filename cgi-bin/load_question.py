#!/usr/bin/python2.5

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


# Load a question file in the 'questions/' sub-directory, parse it,
# and return it to the caller in JSON format
QUESTIONS_DIR = '../questions/'

from parse_questions import parseQuestionsFile

import cgi, os, demjson

form = cgi.FieldStorage()
question_file = form['question_file'].value

fn = QUESTIONS_DIR + question_file + '.txt'
assert os.path.isfile(fn)


# Crucial first line to make sure that Apache serves this data
# correctly - DON'T FORGET THE EXTRA NEWLINES!!!:
print "Content-type: text/plain; charset=iso-8859-1\n\n"
print demjson.encode(parseQuestionsFile(fn))
