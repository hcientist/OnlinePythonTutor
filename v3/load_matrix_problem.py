#!/usr/bin/python

import cgi
import json

form = cgi.FieldStorage()
prob_name = form['problem_name'].value
assert type(prob_name) is str # prevent subclassing shenanigans

print("Content-type: text/plain; charset=iso-8859-1\n")

try:
  for line in open('coding-the-matrix/python_lab.problem2name'):
    p, desc = line.strip().split('%')
    if p == prob_name:
      break

  fn = 'coding-the-matrix/python-lab/' + prob_name + '.py'
  cod = open(fn).read()
  print(json.dumps(dict(code=cod, test='', description=desc)))
except:
  print(json.dumps(dict(code='', test='', status='error')))
 

'''
import doctest
p = doctest.DocTestParser()
examples = p.get_examples(cod)
if len(examples):
  first_ex = examples[0]
  testCod = 'result = ' + first_ex.source

print("Content-type: text/plain; charset=iso-8859-1\n")
print(json.dumps(dict(code=cod, test=testCod)))
'''
