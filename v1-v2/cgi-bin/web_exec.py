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


# Executes the Online Python Tutor back-end as a CGI script, which
# accepts one POST parameter, 'user_script', containing the string
# contents of the Python script that the user wants to execute.
#
# Returns a complete JSON execution trace to the front-end.
#
# This version uses Python 2.6 on the MIT CSAIL servers.
# (note that Python 2.4 doesn't work on CSAIL, but Python 2.6 does)
#
# If you want to run this script, then you'll need to change the
# shebang line at the top of this file to point to your system's Python.
#
# Also, check CGI execute permission in your script directory.
# You might need to create an .htaccess file like the following:
#
#   Options +ExecCGI
#   AddHandler cgi-script .py


# set to true if you want to log queries in DB_FILE 
LOG_QUERIES = False # don't do logging for now

import cgi
import pg_logger

import json

if LOG_QUERIES:
  import os, time, db_common

def web_finalizer(output_lst):
  # use compactly=False to produce human-readable JSON,
  # except at the expense of being a LARGER download
  output_json = json.dumps(output_lst)

  # query logging is optional
  if LOG_QUERIES:
    # just to be paranoid, don't croak the whole program just
    # because there's some error in logging it to the database
    try:
      # log queries into sqlite database:
      had_error = False
      # (note that the CSAIL 'www' user needs to have write permissions in
      #  this directory for logging to work properly)
      if len(output_lst):
        evt = output_lst[-1]['event']
        if evt == 'exception' or evt == 'uncaught_exception':
          had_error = True

      (con, cur) = db_common.db_connect()
      cur.execute("INSERT INTO query_log VALUES (NULL, ?, ?, ?, ?, ?)",
                  (int(time.time()),
                   os.environ.get("REMOTE_ADDR", "N/A"),
                   os.environ.get("HTTP_USER_AGENT", "N/A"),
                   user_script,
                   had_error))
      con.commit()
      cur.close()
    except:
      # haha this is bad form, but silently fail on error :)
      pass

  # Crucial first line to make sure that Apache serves this data
  # correctly - DON'T FORGET THE EXTRA NEWLINES!!!:
  print "Content-type: text/plain; charset=iso-8859-1\n\n"
  print output_json


form = cgi.FieldStorage()
user_script = form['user_script'].value
if 'max_instructions' in form:
  pg_logger.set_max_executed_lines(int(form['max_instructions'].value))

pg_logger.exec_script_str(user_script, web_finalizer)
