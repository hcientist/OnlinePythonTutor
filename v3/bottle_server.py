# Lightweight OPT server that works on both Python 2 and 3

# to invoke, run 'python bottle_server.py'
# and visit http://localhost:8080/index.html
#
# external dependencies: bottle
#
# easy_install pip
# pip install bottle

from bottle import route, get, request, run, template, static_file
import cStringIO
import json
import pg_logger

@route('/<filepath:path>')
def index(filepath):
    return static_file(filepath, root='.')

@get('/exec')
def get_exec():
  out_s = cStringIO.StringIO()

  def json_finalizer(input_code, output_trace):
    ret = dict(code=input_code, trace=output_trace)
    json_output = json.dumps(ret, indent=None)
    out_s.write(json_output)

  options = json.loads(request.query.options_json)

  pg_logger.exec_script_str_local(request.query.user_script,
                                  request.query.raw_input_json,
                                  options['cumulative_mode'],
                                  options['heap_primitives'],
                                  json_finalizer)

  return out_s.getvalue()


@get('/load_matrix_problem')
def load_matrix_problem():
  prob_name = request.query.problem_name
  assert type(prob_name) in (str, unicode)

  # whitelist
  assert prob_name in ('python_comprehension-1',)

  fn = 'matrix-demo/' + prob_name + '.py'
  cod = open(fn).read()

  import doctest
  import sys
  p = doctest.DocTestParser()
  examples = p.get_examples(cod)
  if len(examples):
    first_ex = examples[0]
    #print >> sys.stderr, 'Source:', `first_ex.source`
    testCod = 'result = ' + first_ex.source

  return json.dumps(dict(code=cod, test=testCod))


@get('/submit_matrix_problem')
def submit_matrix_problem():
  user_code = request.query.submitted_code
  prob_name = request.query.problem_name
  assert type(prob_name) in (str, unicode)

  # whitelist
  assert prob_name in ('python_comprehension-1',)

  test_fn = 'matrix-demo/' + prob_name + '.test.py'
  test_cod = open(test_fn).read()

  # concatenate!
  script = test_cod + '\n' + user_code + '\nimport doctest\ndoctest.testmod()'

  import simple_sandbox

  def json_finalizer(executor):
    return json.dumps(dict(code=executor.executed_script,
                           user_stdout=executor.user_stdout.getvalue(),
                           user_stderr=executor.user_stderr.getvalue()))

  return simple_sandbox.exec_str(script, json_finalizer)


if __name__ == "__main__":
    run(host='localhost', port=8080, reloader=True)
