import pg_logger, pprint, json

pp = pprint.PrettyPrinter()

def pprint_finalizer(trace):
  for e in trace:
    pp.pprint(e)


def json_finalizer(output_lst):
  json_output = json.dumps(output_lst, indent=None) # use indent=None for most compact repr
  print json_output


pg_logger.exec_script_str(open('example-code/towers_of_hanoi.txt').read(), json_finalizer)
