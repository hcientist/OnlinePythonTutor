import pg_logger, pprint

pp = pprint.PrettyPrinter()

def pprint_finalizer(trace):
  for e in trace:
    pp.pprint(e)

pg_logger.exec_script_str(open('example-code/closures/closure3.txt').read(), pprint_finalizer)
