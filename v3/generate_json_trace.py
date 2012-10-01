# Generates a JSON trace that is compatible with the js/pytutor.js frontend

import optparse

CUMULATIVE_MODE = False

COMPACT = False
if COMPACT:
  INDENT_LEVEL=None
else:
  INDENT_LEVEL=2


import sys, pg_logger, json


# To make regression tests work consistently across platforms,
# standardize display of floats to 3 significant figures
#
# Trick from:
# http://stackoverflow.com/questions/1447287/format-floats-with-standard-json-module
json.encoder.FLOAT_REPR = lambda f: ('%.3f' % f)


def json_finalizer(input_code, output_trace):
  ret = dict(code=input_code, trace=output_trace)
  json_output = json.dumps(ret, indent=INDENT_LEVEL)
  print(json_output)


def js_var_finalizer(input_code, output_trace):
  global JS_VARNAME
  ret = dict(code=input_code, trace=output_trace)
  json_output = json.dumps(ret, indent=None)
  print("var %s = %s;" % (JS_VARNAME, json_output))


parser = optparse.OptionParser()
parser.add_option("--create_jsvar", dest="js_varname",
                  help="Create a JavaScript variable out of the trace")
(options, args) = parser.parse_args()

if options.js_varname:
  JS_VARNAME = options.js_varname
  pg_logger.exec_script_str(open(args[0]).read(), CUMULATIVE_MODE, js_var_finalizer)
else:
  pg_logger.exec_script_str(open(args[0]).read(), CUMULATIVE_MODE, json_finalizer)
