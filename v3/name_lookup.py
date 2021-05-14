#!/usr/local/bin/python2.7

# Minimal CGI script for name lookups

# Also, check CGI execute permission in your script directory.
# You might need to create an .htaccess file like the following:
#
#   Options +ExecCGI
#   AddHandler cgi-script .py

import cgi
import json
import sys

form = cgi.FieldStorage()
requested_email = form['email'].value

print("Content-type: text/plain; charset=iso-8859-1\n")

for line in open('names.csv'):
    toks = line.strip().split(',')
    name = toks[0].strip()
    email = toks[1].strip()
    if email == requested_email:
        print(json.dumps({'name': name, 'email': email}))
        sys.exit(0) # get out early

print(json.dumps({'error': 1}))
