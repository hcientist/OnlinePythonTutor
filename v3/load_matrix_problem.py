#!/usr/bin/python

import cgi
import doctest
import json
import sys

form = cgi.FieldStorage()
prob_name = form['problem_name'].value
assert type(prob_name) is str # prevent subclassing shenanigans
# whitelist
assert prob_name in ('python_comprehension-1',)

fn = 'matrix-demo/' + prob_name + '.py'
cod = open(fn).read()

p = doctest.DocTestParser()
examples = p.get_examples(cod)
if len(examples):
  first_ex = examples[0]
  testCod = 'result = ' + first_ex.source

print("Content-type: text/plain; charset=iso-8859-1\n")
print(json.dumps(dict(code=cod, test=testCod)))
