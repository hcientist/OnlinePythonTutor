# <INSERT YOUR VERSION OF PYTHON HERE AS A #! LINE>

# Minimal CGI script for Online Python Tutor (v3).

import cgi
import json
import pg_logger
import sys


def cgi_finalizer(input_code, output_trace):
  """Write JSON output for js/pytutor.js as a CGI result."""
  ret = dict(code=input_code, trace=output_trace)
  json_output = json.dumps(ret, indent=None) # use indent=None for most compact repr
  print("Content-type: text/plain; charset=iso-8859-1\n")
  print(json_output)


if len(sys.argv) > 1:
  user_script = open(sys.argv[1]).read()
else:
  form = cgi.FieldStorage()
  user_script = form['user_script'].value

pg_logger.exec_script_str(user_script, cgi_finalizer)
