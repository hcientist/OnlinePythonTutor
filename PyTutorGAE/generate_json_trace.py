# Generates a JSON trace that is compatible with the js/pytutor.js frontend

import sys, pg_logger, json


def json_finalizer(input_code, output_trace):
  ret = dict(code=input_code, trace=output_trace)
  json_output = json.dumps(ret, indent=None) # use indent=None for most compact repr
  print json_output


pg_logger.exec_script_str(open(sys.argv[1]).read(), json_finalizer)

