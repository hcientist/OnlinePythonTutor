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

for name, email in csv.reader(open('names.csv')):
    if email == requested_email:
        print(json.dumps({'name': name, 'email': email}))
        sys.exit(0) # get out early

print(json.dumps({'error': 1}))
