# Generates a JSON trace that is compatible with the js/pytutor.js frontend

CUMULATIVE_MODE = False

COMPACT = False
if COMPACT:
  INDENT_LEVEL=None
else:
  INDENT_LEVEL=2


import sys, pg_logger, json


def json_finalizer(input_code, output_trace):
  ret = dict(code=input_code, trace=output_trace)
  json_output = json.dumps(ret, indent=INDENT_LEVEL)
  print(json_output)


for f in sys.argv[1:]:
  pg_logger.exec_script_str(open(f).read(), CUMULATIVE_MODE, json_finalizer)

