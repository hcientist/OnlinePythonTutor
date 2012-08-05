# Online Python Tutor
# https://github.com/pgbovine/OnlinePythonTutor/
# 
# Copyright (C) 2010-2012 Philip J. Guo (philip@pgbovine.net)
# 
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
# 
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
# CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


# This is the meat of the Online Python Tutor back-end.  It implements a
# full logger for Python program execution (based on pdb, the standard
# Python debugger imported via the bdb module), printing out the values
# of all in-scope data structures after each executed instruction.



import sys
import bdb # the KEY import here!
import re
import traceback
import types

import cStringIO
import pg_encoder


# TODO: not threadsafe:

# upper-bound on the number of executed lines, in order to guard against
# infinite loops
MAX_EXECUTED_LINES = 300

#DEBUG = False
DEBUG = True


IGNORE_VARS = set(('__user_stdout__', '__builtins__', '__name__', '__exception__', '__doc__'))

def get_user_stdout(frame):
  return frame.f_globals['__user_stdout__'].getvalue()

def get_user_globals(frame):
  d = filter_var_dict(frame.f_globals)
  # also filter out __return__ for globals only, but NOT for locals
  if '__return__' in d:
    del d['__return__']
  return d

def get_user_locals(frame):
  return filter_var_dict(frame.f_locals)

def filter_var_dict(d):
  ret = {}
  for (k,v) in d.iteritems():
    if k not in IGNORE_VARS:
      ret[k] = v
  return ret


class PGLogger(bdb.Bdb):

    def __init__(self, finalizer_func):
        bdb.Bdb.__init__(self)
        self.mainpyfile = ''
        self._wait_for_mainpyfile = 0

        # a function that takes the output trace as a parameter and
        # processes it
        self.finalizer_func = finalizer_func

        # each entry contains a dict with the information for a single
        # executed line
        self.trace = []

        #http://stackoverflow.com/questions/2112396/in-python-in-google-app-engine-how-do-you-capture-output-produced-by-the-print
        self.GAE_STDOUT = sys.stdout

        # Key:   function object
        # Value: parent frame
        self.closures = {}
                 
        # List of frames to KEEP AROUND after the function exits,
        # because nested functions were defined in those frames.
        # ORDER matters for aesthetics.
        self.zombie_frames = []

        # all globals that ever appeared in the program, in the order in
        # which they appeared. note that this might be a superset of all
        # the globals that exist at any particular execution point,
        # since globals might have been deleted (using, say, 'del')
        self.all_globals_in_order = []

        # very important for this single object to persist throughout
        # execution, or else canonical small IDs won't be consistent.
        self.encoder = pg_encoder.ObjectEncoder()


    # Returns the (lexical) parent frame of the function that was called
    # to create the stack frame 'frame'.
    #
    # OKAY, this is a SUPER hack, but I don't see a way around it
    # since it's impossible to tell exactly which function
    # ('closure') object was called to create 'frame'.
    #
    # The Python interpreter doesn't maintain this information,
    # so unless we hack the interpreter, we will simply have
    # to make an educated guess based on the contents of local
    # variables inherited from possible parent frame candidates.
    def get_parent_frame(self, frame):
      for (func_obj, parent_frame) in self.closures.iteritems():
        # ok, there's a possible match, but let's compare the
        # local variables in parent_frame to those of frame
        # to make sure. this is a hack that happens to work because in
        # Python, each stack frame inherits ('inlines') a copy of the
        # variables from its (lexical) parent frame.
        if func_obj.__code__ == frame.f_code:
          all_matched = True
          for k in parent_frame.f_locals:
            if k != '__return__' and k in frame.f_locals:
              if parent_frame.f_locals[k] != frame.f_locals[k]:
                all_matched = False
                break
          
          if all_matched:
            return parent_frame

      return None


    def get_zombie_frame_id(self, f):
      # should be None unless this is a zombie frame
      try:
        # make the frame id's one-indexed for clarity
        # (and to prevent possible confusion with None)
        return self.zombie_frames.index(f) + 1
      except ValueError:
        pass
      return None

    def lookup_zombie_frame_by_id(self, idx):
      # remember this is one-indexed
      return self.zombie_frames[idx - 1]


    # unused ...
    #def reset(self):
    #    bdb.Bdb.reset(self)
    #    self.forget()


    def forget(self):
        self.lineno = None
        self.stack = []
        self.curindex = 0
        self.curframe = None

    def setup(self, f, t):
        self.forget()
        self.stack, self.curindex = self.get_stack(f, t)
        self.curframe = self.stack[self.curindex][0]


    # Override Bdb methods

    def user_call(self, frame, argument_list):
        """This method is called when there is the remote possibility
        that we ever need to stop in this function."""
        if self._wait_for_mainpyfile:
            return
        if self.stop_here(frame):
            self.interaction(frame, None, 'call')

    def user_line(self, frame):
        """This function is called when we stop or break at this line."""
        if self._wait_for_mainpyfile:
            if (self.canonic(frame.f_code.co_filename) != "<string>" or 
                frame.f_lineno <= 0):
                return
            self._wait_for_mainpyfile = 0
        self.interaction(frame, None, 'step_line')

    def user_return(self, frame, return_value):
        """This function is called when a return trap is set here."""
        frame.f_locals['__return__'] = return_value
        self.interaction(frame, None, 'return')

    def user_exception(self, frame, exc_info):
        exc_type, exc_value, exc_traceback = exc_info
        """This function is called if an exception occurs,
        but only if we are to stop at or just below this level."""
        frame.f_locals['__exception__'] = exc_type, exc_value
        if type(exc_type) == type(''):
            exc_type_name = exc_type
        else: exc_type_name = exc_type.__name__
        self.interaction(frame, exc_traceback, 'exception')


    # General interaction function

    def interaction(self, frame, traceback, event_type):
        self.setup(frame, traceback)
        tos = self.stack[self.curindex]
        top_frame = tos[0]
        lineno = tos[1]

        self.encoder.reset_heap() # VERY VERY VERY IMPORTANT,
                                  # or else we won't properly capture heap object mutations in the trace!


        # only render zombie frames that are NO LONGER on the stack
        cur_stack_frames = [e[0] for e in self.stack]
        zombie_frames_to_render = [e for e in self.zombie_frames if e not in cur_stack_frames]


        # each element is a pair of (function name, ENCODED locals dict)
        encoded_stack_locals = []


        # returns a dict with keys: function name, frame id, id of parent frame, encoded_locals dict
        def create_encoded_stack_entry(cur_frame):
          ret = {}


          # your immediate parent frame ID is parent_frame_id_list[0]
          # and all other members are your further ancestors
          parent_frame_id_list = []

          f = cur_frame
          while True:
            p = self.get_parent_frame(f)
            if p:
              pid = self.get_zombie_frame_id(p)
              assert pid
              parent_frame_id_list.append(pid)
              f = p
            else:
              break


          cur_name = cur_frame.f_code.co_name

          # special case for lambdas - grab their line numbers too
          if cur_name == '<lambda>':
            cur_name = '<lambda:line ' + str(cur_frame.f_code.co_firstlineno) + '>'
          elif cur_name == '':
            cur_name = 'unnamed function'

          # encode in a JSON-friendly format now, in order to prevent ill
          # effects of aliasing later down the line ...
          encoded_locals = {}

          for (k, v) in get_user_locals(cur_frame).iteritems():
            is_in_parent_frame = False

            # don't display locals that appear in your parents' stack frames,
            # since that's redundant
            for pid in parent_frame_id_list:
              parent_frame = self.lookup_zombie_frame_by_id(pid)
              if k in parent_frame.f_locals:
                # ignore __return__
                if k != '__return__':
                  # these values SHOULD BE ALIASES
                  # (don't do an 'is' check since it might not fire for primitives)
                  assert parent_frame.f_locals[k] == v
                  is_in_parent_frame = True

            if is_in_parent_frame:
              continue

            # don't display some built-in locals ...
            if k == '__module__':
              continue

            encoded_val = self.encoder.encode(v)

            # UGH, this is SUPER ugly but needed for nested function defs
            if type(v) in (types.FunctionType, types.MethodType):
              try:
                enclosing_frame = self.closures[v]
                enclosing_frame_id = self.get_zombie_frame_id(enclosing_frame)
                self.encoder.set_function_parent_frame_ID(encoded_val, enclosing_frame_id)
              except KeyError:
                pass
            encoded_locals[k] = encoded_val


          # order the variable names in a sensible way:

          # Let's start with co_varnames, since it (often) contains all
          # variables in this frame, some of which might not exist yet.
          ordered_varnames = []
          for e in cur_frame.f_code.co_varnames:
            if e in encoded_locals:
              ordered_varnames.append(e)

          # sometimes co_varnames doesn't contain all of the true local
          # variables: e.g., when executing a 'class' definition.  in that
          # case, iterate over encoded_locals and push them onto the end
          # of ordered_varnames in alphabetical order
          for e in sorted(encoded_locals.keys()):
            if e != '__return__' and e not in ordered_varnames:
              ordered_varnames.append(e)

          # finally, put __return__ at the very end
          if '__return__' in encoded_locals:
            ordered_varnames.append('__return__')

          # crucial sanity checks!
          assert len(ordered_varnames) == len(encoded_locals)
          for e in ordered_varnames:
            assert e in encoded_locals

          return dict(func_name=cur_name,
                      frame_id=self.get_zombie_frame_id(cur_frame),
                      parent_frame_id_list=parent_frame_id_list,
                      encoded_locals=encoded_locals,
                      ordered_varnames=ordered_varnames)


        i = self.curindex

        # look for whether a nested function has been defined during
        # this particular call:
        if i > 1: # i == 1 implies that there's only a global scope visible
          for (k, v) in get_user_locals(top_frame).iteritems():
            if (type(v) in (types.FunctionType, types.MethodType) and \
                v not in self.closures):
              self.closures[v] = top_frame
              if not top_frame in self.zombie_frames:
                self.zombie_frames.append(top_frame)


        # climb up until you find '<module>', which is (hopefully) the global scope
        while True:
          cur_frame = self.stack[i][0]
          cur_name = cur_frame.f_code.co_name
          if cur_name == '<module>':
            break

          encoded_stack_locals.append(create_encoded_stack_entry(cur_frame))
          i -= 1

        zombie_encoded_stack_locals = [create_encoded_stack_entry(e) for e in zombie_frames_to_render]


        # encode in a JSON-friendly format now, in order to prevent ill
        # effects of aliasing later down the line ...
        encoded_globals = {}
        for (k, v) in get_user_globals(tos[0]).iteritems():
          encoded_val = self.encoder.encode(v)

          # UGH, this is SUPER ugly but needed for nested function defs
          if type(v) in (types.FunctionType, types.MethodType):
            try:
              enclosing_frame = self.closures[v]
              enclosing_frame_id = self.get_zombie_frame_id(enclosing_frame)
              self.encoder.set_function_parent_frame_ID(encoded_val, enclosing_frame_id)
            except KeyError:
              pass
          encoded_globals[k] = encoded_val

          if k not in self.all_globals_in_order:
            self.all_globals_in_order.append(k)

        # filter out globals that don't exist at this execution point
        # (because they've been, say, deleted with 'del')
        ordered_globals = [e for e in self.all_globals_in_order if e in encoded_globals]
        assert len(ordered_globals) == len(encoded_globals)


        # merge zombie_encoded_stack_locals and encoded_stack_locals
        # into one master ordered list using some simple rules for
        # making it look aesthetically pretty
        stack_to_render = [];

        # first push all regular stack entries BACKWARDS
        if encoded_stack_locals:
          stack_to_render = encoded_stack_locals[::-1]
          for e in stack_to_render:
            e['is_zombie'] = False
            e['is_highlighted'] = False

          stack_to_render[-1]['is_highlighted'] = True


        # zombie_encoded_stack_locals consists of exited functions that have returned
        # nested functions. Push zombie stack entries at the BEGINNING of stack_to_render,
        # EXCEPT put zombie entries BEHIND regular entries that are their parents
        for e in zombie_encoded_stack_locals[::-1]:
          # don't display return value for zombie frames
          try:
            e['ordered_varnames'].remove('__return__')
          except ValueError:
            pass

          e['is_zombie'] = True
          e['is_highlighted'] = False # never highlight zombie entries

          # j should be 0 most of the time, so we're always inserting new
          # elements to the front of stack_to_render (which is why we are
          # iterating backwards over zombie_stack_locals).
          j = 0
          while j < len(stack_to_render):
            if stack_to_render[j]['frame_id'] in e['parent_frame_id_list']:
              j += 1
              continue
            break

          stack_to_render.insert(j, e)


        trace_entry = dict(line=lineno,
                           event=event_type,
                           func_name=tos[0].f_code.co_name,
                           globals=encoded_globals,
                           ordered_globals=ordered_globals,
                           #stack_locals=encoded_stack_locals,               # DEPRECATED in favor of stack_to_render
                           #zombie_stack_locals=zombie_encoded_stack_locals, # DEPRECATED in favor of stack_to_render
                           stack_to_render=stack_to_render,
                           heap=self.encoder.get_heap(),
                           stdout=get_user_stdout(tos[0]))

        # if there's an exception, then record its info:
        if event_type == 'exception':
          # always check in f_locals
          exc = frame.f_locals['__exception__']
          trace_entry['exception_msg'] = exc[0].__name__ + ': ' + str(exc[1])

        self.trace.append(trace_entry)

        if len(self.trace) >= MAX_EXECUTED_LINES:
          self.trace.append(dict(event='instruction_limit_reached', exception_msg='(stopped after ' + str(MAX_EXECUTED_LINES) + ' steps to prevent possible infinite loop)'))
          self.force_terminate()

        self.forget()


    def _runscript(self, script_str):
        # When bdb sets tracing, a number of call and line events happens
        # BEFORE debugger even reaches user's code (and the exact sequence of
        # events depends on python version). So we take special measures to
        # avoid stopping before we reach the main script (see user_line and
        # user_call for details).
        self._wait_for_mainpyfile = 1


        # I think Google App Engine takes care of sandboxing, but maybe
        # we should do some extra sandboxing ourselves ...
        '''
        # ok, let's try to sorta 'sandbox' the user script by not
        # allowing certain potentially dangerous operations:
        user_builtins = {}
        for (k,v) in __builtins__.iteritems():
          if k in ('reload', 'input', 'apply', 'open', 'compile', 
                   '__import__', 'file', 'eval', 'execfile',
                   'exit', 'quit', 'raw_input', 
                   'dir', 'globals', 'locals', 'vars',
                   'compile'):
            continue
          user_builtins[k] = v
        '''


        user_stdout = cStringIO.StringIO()

        sys.stdout = user_stdout
        user_globals = {"__name__"    : "__main__",
                        "__builtins__" : __builtins__,
                        "__user_stdout__" : user_stdout}

        try:
          self.run(script_str, user_globals, user_globals)
        # sys.exit ...
        except SystemExit:
          #sys.exit(0)
          raise bdb.BdbQuit
        except:
          if DEBUG:
            traceback.print_exc()

          trace_entry = dict(event='uncaught_exception')

          exc = sys.exc_info()[1]
          if hasattr(exc, 'lineno'):
            trace_entry['line'] = exc.lineno
          if hasattr(exc, 'offset'):
            trace_entry['offset'] = exc.offset

          if hasattr(exc, 'msg'):
            trace_entry['exception_msg'] = "Error: " + exc.msg
          else:
            trace_entry['exception_msg'] = "Unknown error"

          self.trace.append(trace_entry)
          #self.finalize()
          raise bdb.BdbQuit # need to forceably STOP execution


    def force_terminate(self):
      #self.finalize()
      raise bdb.BdbQuit # need to forceably STOP execution


    def finalize(self):
      sys.stdout = self.GAE_STDOUT # very important!

      assert len(self.trace) <= (MAX_EXECUTED_LINES + 1)

      # filter all entries after 'return' from '<module>', since they
      # seem extraneous:
      res = []
      for e in self.trace:
        res.append(e)
        if e['event'] == 'return' and e['func_name'] == '<module>':
          break

      # another hack: if the SECOND to last entry is an 'exception'
      # and the last entry is return from <module>, then axe the last
      # entry, for aesthetic reasons :)
      if len(res) >= 2 and \
         res[-2]['event'] == 'exception' and \
         res[-1]['event'] == 'return' and res[-1]['func_name'] == '<module>':
        res.pop()

      self.trace = res

      #for e in self.trace: print >> sys.stderr, e

      self.finalizer_func(self.trace)



# the MAIN meaty function!!!
def exec_script_str(script_str, finalizer_func):
  logger = PGLogger(finalizer_func)

  try:
    logger._runscript(script_str)
  except bdb.BdbQuit:
    pass
  finally:
    logger.finalize()

