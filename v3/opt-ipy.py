# Online Python Tutor extension for the IPython shell
# http://ipython.org/ipython-doc/stable/config/extensions/index.html

# defines a '%clear' magic to clear the user's global environment

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

#INDENT_LEVEL = 2   # human-readable
INDENT_LEVEL = None # compact


# TODO: support incremental pushes to the OPT frontend for efficiency
# and better "snappiness" (although the speed seems fine for now)


class OptHistory(object):
    def __init__(self):
        self.executed_stmts = []

    def pop_last(self):
        self.executed_stmts.pop()

    def check_rep(self):
        pass

    def get_code(self):
        return '\n'.join(self.executed_stmts)

    def run_str(self, stmt_str):
        self.executed_stmts.append(stmt_str)

        opt_trace = pg_logger.exec_script_str_local(self.get_code(), [], False, False, lambda cod, trace: trace)

        last_evt = opt_trace[-1]['event']
        if last_evt == 'exception':
            epic_fail = True
        else:
            assert last_evt == 'return'
            epic_fail = False

        output_dict = dict(code=self.get_code(), trace=opt_trace)
        json_output = json.dumps(output_dict, indent=INDENT_LEVEL)

        # if this statement ended in an exception, delete it from the
        # history and pretend it never happened
        if epic_fail:
            self.pop_last()

        self.check_rep()
        return json_output


# called right before a statement gets executed
def opt_pre_run_code_hook(self):
    # when you run multiple statements on one line using a semicolon:
    # e.g., "print x; print y", this function will fire multiple times.
    # we want to avoid duplicates!
    last_cmd = self.history_manager.input_hist_parsed[-1]
    last_cmd_index = len(self.history_manager.input_hist_parsed) - 1

    # also don't intercept special ipython commands
    if 'get_ipython().' in last_cmd:
        return

    if self.meta.last_cmd_index == last_cmd_index:
        assert self.meta.last_cmd == last_cmd
        return # punt!!!

    self.meta.last_cmd = last_cmd
    self.meta.last_cmd_index = last_cmd_index

    trace_json = self.meta.opt_history.run_str(last_cmd)
    #print trace_json
    urllib2.urlopen("http://localhost:8888/post", trace_json)


# clear global namespace and reset history
def opt_clear(self, params):
    ip = get_ipython()

    filtered_user_ns = set()
    for k, v in ip.user_ns.iteritems():
        if k[0] == '_':
            continue
        if k in ('In', 'Out', 'help', 'quit', 'exit', 'get_ipython'):
            continue
        filtered_user_ns.add(k)

    for k in filtered_user_ns:
        del ip.user_ns[k]

    ip.meta.opt_history = OptHistory() # just create a new one!

    empty_msg = dict(code='', trace=[])
    urllib2.urlopen("http://localhost:8888/post", json.dumps(empty_msg))


def load_ipython_extension(ipython):
    # The `ipython` argument is the currently active `InteractiveShell`
    # instance, which can be used in any way. This allows you to register
    # new magics or aliases, for example.

    ipython.meta.opt_history = OptHistory()

    ipython.meta.last_cmd = None
    ipython.meta.last_cmd_index = -1 # set to an impossible initial value

    # NB: spelling might be different in older IPython versions
    ipython.set_hook('pre_run_code_hook', opt_pre_run_code_hook)
    ipython.define_magic('clear', opt_clear)


def unload_ipython_extension(ipython):
    # If you want your extension to be unloadable, put that logic here.
    pass

