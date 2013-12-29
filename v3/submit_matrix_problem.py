#!/usr/bin/python

import cgi
import doctest
import json
import urllib
import urllib2

form = cgi.FieldStorage()
user_code = form['submitted_code'].value
prob_name = form['problem_name'].value
#assert type(prob_name) is str

# whitelist
assert prob_name in ('python_comprehension-1',)

test_fn = 'matrix-demo/' + prob_name + '.test.py'
test_cod = open(test_fn).read()

# concatenate!
script = test_cod + '\n' + user_code + \
'''
import doctest
(n_fail, n_tests) = doctest.testmod(verbose=False)
if n_fail == 0:
  print("All %d tests passed!" % n_tests)
'''

# run on the EC2 sandbox
url = 'http://ec2-107-20-94-197.compute-1.amazonaws.com/cgi-bin/run_code.py'
values = {'user_script' : script}

data = urllib.urlencode(values)
req = urllib2.Request(url, data)
response = urllib2.urlopen(req)
the_page = response.read()

print("Content-type: text/plain; charset=iso-8859-1\n")
print(the_page)
