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

        # first line number of each line in self.executed_stmts
        self.first_lineno = []

        # each element is a LIST containing an OPT trace
        self.output_traces = []

        # was the last executed stmt an exception?
        self.last_exec_is_exception = False


    def pop_last(self):
        self.executed_stmts.pop()
        self.first_lineno.pop()
        self.output_traces.pop()


    def check_rep(self):
        assert len(self.executed_stmts) == len(self.first_lineno) == len(self.output_traces)


    def get_code(self):
        return '\n'.join(self.executed_stmts)

    def get_trace(self):
        ret = []
        for t in self.output_traces:
            for e in t:
                ret.append(e)
        return ret


    def run_str(self, stmt_str, user_globals):
        opt_trace = pg_logger.exec_str_with_user_ns(stmt_str, user_globals, get_trace)

        # 'clean up' the trace a bit:
        if len(self.output_traces):
            # lop off the last element of the previous entry since it should match
            # the first element of opt_trace
            end_of_last_trace = self.output_traces[-1].pop()
            #print 'END:', end_of_last_trace
            #print 'CUR:', opt_trace[0]

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

        if len(self.executed_stmts):
            lineno = self.first_lineno[-1] + len(self.executed_stmts[-1].splitlines())
        else:
            lineno = 1

        # adjust all the line numbers in the trace
        for elt in opt_trace:
            elt['line'] += (lineno - 1)

        self.executed_stmts.append(stmt_str)
        self.first_lineno.append(lineno)
        self.output_traces.append(opt_trace)

        output_dict = dict(code=self.get_code(), trace=self.get_trace())
        json_output = json.dumps(output_dict, indent=INDENT_LEVEL)

        print json_output

        self.check_rep()


def get_trace(input_code, output_trace):
    return output_trace


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

