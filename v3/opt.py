# Online Python Tutor extension for the IPython shell
# http://ipython.org/ipython-doc/stable/config/extensions/index.html

# Tested on IPython 1.0.dev

# pgbovine
import os, sys, urllib2, json

'''
modpath = __file__
# grab the .py file since that's the symlink
if modpath.endswith('.pyc') and os.path.exists(modpath[:-1]):
    modpath = modpath[:-1]
sys.path.insert(0, os.path.dirname(os.path.realpath(modpath)))
'''

import pg_logger

import pprint

pp = pprint.PrettyPrinter()


# To make regression tests work consistently across platforms,
# standardize display of floats to 3 significant figures
#
# Trick from:
# http://stackoverflow.com/questions/1447287/format-floats-with-standard-json-module
json.encoder.FLOAT_REPR = lambda f: ('%.3f' % f)

INDENT_LEVEL = 2
#INDENT_LEVEL = None


# TODO: support incremental pushes to the OPT frontend for efficiency
# and better "snappiness"


# TODO: support line number adjustments for function definitions

class OptHistory(object):
    def __init__(self):
        self.executed_stmts = []

        # each element is a LIST containing an OPT trace
        self.output_traces = []

        # was the last executed stmt an exception?
        self.last_exec_is_exception = False

    def pop_last(self):
        self.executed_stmts.pop()
        self.output_traces.pop()

    def run_str(self, cmd_string, user_globals):
        opt_trace = pg_logger.exec_str_with_user_ns(cmd_string, user_globals, get_trace)

        # clobber the last entry
        if self.last_exec_is_exception:
            self.pop_last()

        # did this end in disaster?
        last_evt = opt_trace[-1]['event']
        if last_evt == 'exception':
            self.last_exec_is_exception = True
        else:
            assert last_evt == 'return'
            self.last_exec_is_exception = False

        pp.pprint(opt_trace)
        

        
def get_trace(input_code, output_trace):
    return output_trace


def custom_json_finalizer(input_code, output_trace):
  ret = dict(code=input_code, trace=output_trace)
  json_output = json.dumps(ret, indent=INDENT_LEVEL)
  return json_output


# called right before a statement gets executed
def opt_pre_run_code_hook(self):
    filtered_ns = {}
    for k, v in self.user_ns.iteritems():
        if k[0] == '_':
            continue
        if k in ('In', 'Out', 'help', 'quit', 'exit', 'get_ipython'):
            continue
        filtered_ns[k] = v

    last_cmd = self.history_manager.input_hist_parsed[-1]
    print 'last_cmd:', last_cmd
    self.meta.opt_history.run_str(last_cmd, filtered_ns)
    #urllib2.urlopen("http://localhost:8888/post", last_cmd)


def load_ipython_extension(ipython):
    # The `ipython` argument is the currently active `InteractiveShell`
    # instance, which can be used in any way. This allows you to register
    # new magics or aliases, for example.

    ipython.meta.opt_history = OptHistory()

    # NB: spelling might be different in older IPython versions
    ipython.set_hook('pre_run_code_hook', opt_pre_run_code_hook)


def unload_ipython_extension(ipython):
    # If you want your extension to be unloadable, put that logic here.
    pass

