#!/usr/bin/python

import cgi
import urllib
import urllib2

#import cgitb
#cgitb.enable()

form = cgi.FieldStorage()
user_code = form['submitted_code'].value
prob_name = form['problem_name'].value

# run tests on EC2
url = 'http://ec2-107-20-94-197.compute-1.amazonaws.com/cgi-bin/test_matrix_code.py'
values = {'user_script' : user_code, 'problem_name': prob_name}

data = urllib.urlencode(values)
req = urllib2.Request(url, data)
response = urllib2.urlopen(req)
the_page = response.read()

print("Content-type: text/plain; charset=iso-8859-1\n")
print(the_page)
