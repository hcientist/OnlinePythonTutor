# Ruby backend for Online "Python" Tutor
# created on 2015-06-29 by Philip Guo
#
# WARNING: this script only works on a *hacked version* of Ruby 2.X since
# we use the TracePoint API and custom fields such as binding::frame_id.
# See custom-ruby-interpreter/ for details.

# simple Ruby idiom for assert:
# raise "error msg" unless <condition to assert>

# TODO
#
# - display constants defined INSIDE OF modules or classes
# - display class and instance variables
# - when inside of a method, maybe display implicit 'self' parameter if
#   it's not the toplevel self?
# - display the 'binding' within a proc/lambda object, which represents
#   its closure
# - support gets() for user input using the restart hack mechanism
#   - user input stored in $_
# - support 'include'-ing a module and bringing in variables into namespace
# - in OPT frontend for Ruby, relabel "Global frame" as "Globals" or something
#
# Useful notes from http://phrogz.net/programmingruby/frameset.html:
#  - "First, every object has a unique object identifier (abbreviated as
#    object id)."
#
# Limitations:
# - no support for (lexical) environment pointers, since MRI doesn't seem to
#   expose them. We can see only the current (dynamic) stack backtrace
#   with debug_inspector.
#   - NB: is this true? at least we have 'binding' for procs/lambdas

# style guide: https://github.com/styleguide/ruby


require 'json'
require 'stringio'

require 'debug_inspector' # gem install debug_inspector, use on Ruby 2.X

#require 'binding_of_caller' # gem install binding_of_caller


# pass 'stdout' to print trace to stdout
# pass 'jstrace' to print a JS trace to test-trace.js
trace_output_fn = ARGV[0]
trace_output_fn = "../../../v3/test-trace.js" if trace_output_fn == 'jstrace'

script_name = ARGV[1]
cod = File.open(script_name).read

cur_trace = []
res = {'code' => cod.dup, # make a snapshot of the code NOW before it's modified
       'trace' => cur_trace}

# canonicalize to pretty-print
cur_frame_id = 1
ordered_frame_ids = {}

stdout_buffer = StringIO.new

n_steps = 0
#MAX_STEPS = 30
MAX_STEPS = 300

n_lines_added = nil

class MaxStepsException < RuntimeError
end


# collect the sets of these variables RIGHT BEFORE the user's code runs
# so that we can do a set difference later to see what the user defined
base_globals_set = global_variables
base_constants_set = Module.constants
base_inst_vars_set = self.instance_variables # toplevel instance variables are set on 'self'
base_class_vars_set = Object.class_variables # toplevel class variables are set on 'Object'
base_methods_set  = Object.private_methods # toplevel defined methods are set on 'Object'


pg_tracer = TracePoint.new(:line,:class,:end,:call,:return,:raise,:b_call,:b_return) do |tp|
  next if tp.path != '(eval)' # 'next' is a 'return' from a block

  raise MaxStepsException if n_steps > MAX_STEPS

  #STDERR.puts '---'
  #STDERR.puts [tp.event, tp.lineno, tp.path, tp.defined_class, tp.method_id].inspect
  # TODO: look into tp.defined_class and tp.method_id attrs

  retval = nil
  if tp.event == :return || tp.event == :b_return
    #STDERR.print 'RETURN!!! '
    #STDERR.puts tp.return_value.inspect
    retval = tp.return_value.inspect # TODO: make into true objects later
  end

  evt_type = case tp.event
             when :line then "step_line"
             when :call, :b_call, :class then "call"
             when :return, :b_return, :end then "return"
             when :raise then "exception"
             end

  entry = {}

  entry['func_name'] = '<toplevel>' #tp.method_id
  entry['line'] = tp.lineno
  entry['event'] = evt_type

  # make a copy to take a snapshot at this point in time
  entry['stdout'] = stdout_buffer.string.dup
  #STDERR.print 'stdout: '
  #STDERR.puts entry['stdout']

  stack = []
  heap = {} # TODO: xxx
  entry['stack_to_render'] = stack
  entry['heap'] = heap

  # globals
  globals = {}
  entry['globals'] = globals

  true_globals = (global_variables - base_globals_set) # set difference
  #STDERR.print 'Globals: '
  #STDERR.puts true_globals.inspect
  entry['ordered_globals'] = true_globals.map { |e| e.to_s }

  true_globals.each.with_index do |varname, i|
    val = eval(varname.to_s) # TODO: is there a better way? this seems hacky!
    #STDERR.print varname, ' -> ', val.inspect
    #STDERR.puts
    globals[varname.to_s] = val.inspect # TODO: make into true objects later
  end

  # toplevel constants (stuff them in globals)
  toplevel_constants = (Module.constants - base_constants_set) # set difference
  #STDERR.print 'Constants: '
  #STDERR.puts toplevel_constants.inspect
  entry['ordered_globals'] += toplevel_constants.map { |e| e.to_s }
  toplevel_constants.each do |varname|
    val = eval(varname.to_s) # TODO: is there a better way? this seems hacky!
    #STDERR.print varname, ' -> ', val.inspect
    #STDERR.puts
    globals[varname.to_s] = val.inspect # TODO: make into true objects later
  end

  # toplevel methods, class vars, and instance vars
  # just stuff them in globals, even though technically they're not
  # really global variables in Ruby; they're part of the weird 'self'
  # instance and also 'Object' itself ... quirky
  toplevel_methods = Object.private_methods - base_methods_set
  toplevel_class_vars = Object.class_variables - base_class_vars_set
  toplevel_inst_vars = self.instance_variables - base_inst_vars_set

  #STDERR.puts 'toplevel_methods: %s' % toplevel_methods.inspect
  #STDERR.puts 'toplevel_class_vars: %s' % toplevel_class_vars.inspect
  #STDERR.puts 'toplevel_inst_vars: %s' % toplevel_inst_vars.inspect

  entry['ordered_globals'] += toplevel_methods.map { |e| e.to_s }
  entry['ordered_globals'] += toplevel_class_vars.map { |e| e.to_s }
  entry['ordered_globals'] += toplevel_inst_vars.map { |e| e.to_s }


  toplevel_methods.each do |varname|
    val = Object.method(varname)
    #STDERR.print varname, ' -> ', val.inspect
    #STDERR.puts
    globals[varname.to_s] = val.inspect # TODO: make into true objects later
  end

  toplevel_class_vars.each do |varname|
    val = Object.class_variable_get(varname)
    #STDERR.print varname, ' -> ', val.inspect
    #STDERR.puts
    globals[varname.to_s] = val.inspect # TODO: make into true objects later
  end

  toplevel_inst_vars.each do |varname|
    val = self.instance_variable_get(varname)
    #STDERR.print varname, ' -> ', val.inspect
    #STDERR.puts
    globals[varname.to_s] = val.inspect # TODO: make into true objects later
  end

  if tp.event == :raise
    #STDERR.print 'RAISE!!! '
    #STDERR.puts tp.raised_exception.inspect
    entry['exception_msg'] = tp.raised_exception.inspect # TODO: make into true objects later
  end

  # adapted from https://github.com/ko1/pretty_backtrace/blob/master/lib/pretty_backtrace.rb
  def self.iseq_local_variables iseq
    _,_,_,_,arg_info,name,path,a_path,_,type,lvs, * = iseq.to_a
    lvs
  end

  # adapted from https://github.com/ko1/pretty_backtrace/blob/master/lib/pretty_backtrace.rb
  RubyVM::DebugInspector.open do |dc|
    locs = dc.backtrace_locations

    locs.each.with_index do |loc, i|
      # ignore first two boilerplate frames
      next if i < 2
      # and totally punt as soon as you hit the 'eval' frame
      break if /in `eval'/ =~ loc.to_s

      stack_entry = {}
      stack_entry['is_highlighted'] = false # set the last entry to true later

      is_main = false

      iseq = dc.frame_iseq(i)
      if !iseq
        # if you're, say, in a built-in operator like :/ (division)
        # totally punt since we can't get any useful info
        next
      else
        b = dc.frame_binding(i)

        # frame_id field exists only in my hacked Ruby interpreter!
        canonical_fid = ordered_frame_ids[b.frame_id]
        if !canonical_fid
          canonical_fid = cur_frame_id
          ordered_frame_ids[b.frame_id] = cur_frame_id
          cur_frame_id += 1
        end

        # special-case handling for the toplevel '<main>' frame
        # (NB: don't do this for now)
        #is_main = true if loc.label == '<main>'

        stack_entry['func_name'] = '%s:%d' % [loc.label, loc.lineno]


        #STDERR.print 'frame_id: '
        #STDERR.puts canonical_fid
        stack_entry['frame_id'] = canonical_fid
        stack_entry['unique_hash'] = stack_entry['func_name'] + '_f' + stack_entry['frame_id'].to_s

        # unsupported features
        stack_entry['is_parent'] = false
        stack_entry['is_zombie'] = false
        stack_entry['parent_frame_id_list'] = []

        lvs = iseq_local_variables(iseq)
        lvs_val = lvs.inject({}){|r, lv|
          begin
            v = b.local_variable_get(lv).inspect # TODO: make into true objects later
            r[lv] = v
          rescue NameError
            # ignore
          end
          r
        }

        stack_entry['ordered_varnames'] = lvs.map { |e| e.to_s }
        stack_entry['encoded_locals'] = lvs_val

        # just fold everything into globals rather than creating a
        # separate (redundant) frame for '<main>'
        # (NB: don't do this for now ... just relabel "Global frames" as
        # 'Global Object' or something)
        if is_main
          entry['ordered_globals'] += stack_entry['ordered_varnames']
          entry['globals'].update(stack_entry['encoded_locals'])
        end
      end

      #STDERR.puts 'is_main: %s' % is_main
      #STDERR.print '>>> ', loc, ' ', lvs, lvs_val
      #STDERR.puts
      #STDERR.puts

      # no separate frame for main since its local variables were folded
      # into globals
      if !is_main
        stack << stack_entry
      end

    end
  end

  #STDERR.puts

  # massage the topmost stack entry
  if stack.length > 0
    stack[0]['is_highlighted'] = true
    if tp.event == :return || tp.event == :b_return
      stack[0]['ordered_varnames'] << '__return__'
      stack[0]['encoded_locals']['__return__'] = retval
    end
  end

  # now REVERSE the stack so that it grows downward
  stack.reverse!

  n_steps += 1

  cur_trace << entry
end


begin
  # we are redirecting stdout so we need to print all warnings to stderr!
  pg_tracer.enable
  $stdout = stdout_buffer

  # super-hack: add an extra 'nil' line to execute at the end so that the
  # tracer can easily pick up on the final executed line in '(eval)'
  # - this isn't a 'real' line number in the user's code since we've
  #   inserted an extra line
  if cod[-1] == "\n"
    cod << "nil"
    n_lines_added = 1
  else
    cod << "\nnil"
    n_lines_added = 2
  end

  eval(cod) # the filename of the user's code is '(eval)'
  pg_tracer.disable
rescue SyntaxError
  $stdout = STDOUT
  puts "SyntaxError -- blarrrggg!!!"
  exc_object = $!

  raw_exc_message = exc_object.message
  # parse out the line number and message from raw_exc_message. e.g.,:
  # "(eval):11: syntax error, unexpected end-of-input, expecting keyword_end"
  # - we want to extract out the line number of 11 and the message of
  #   "syntax error, unexpected end-of-input, expecting keyword_end"
  /[:](\d+)[:] (.*)$/ =~ raw_exc_message
  lineno = $1.to_i
  exc_message = $2

  puts raw_exc_message
  puts lineno
  puts exc_message

  # From: https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/opt-trace-format.md
  # "If the trace has exactly 1 entry and it's an uncaught_exception, then
  # the OPT frontend doesn't switch to the visualization at all ...
  # instead it displays a "syntax error"-like thingy in the code editor.
  # It will highlight the faulting line, indicated by the line field and
  # display exception_msg there. So if you want to indicate a syntax error,
  # then create a trace with exactly ONE entry that's an uncaught_exception.
  singleton_entry = {}
  # mutate cur_trace in place rather than reassigning, since res already includes it
  cur_trace.clear
  cur_trace << singleton_entry
  singleton_entry['event'] = 'uncaught_exception'
  singleton_entry['line'] = lineno
  singleton_entry['exception_msg'] = exc_message
rescue MaxStepsException
  $stdout = STDOUT

  # take the final trace entry & make it into a instruction_limit_reached event
  if cur_trace.length > 0
    cur_trace[-1]['event'] = 'instruction_limit_reached'
    cur_trace[-1]['exception_msg'] = "(stopped after %d steps to prevent possible infinite loop)" % MAX_STEPS
  end
rescue
  $stdout = STDOUT
  STDERR.puts "other exception -- EEEEEEEE!!!"
  STDERR.puts $!
  # ignore since we've already handled a :raise event in the trace by now
ensure
  $stdout = STDOUT

  # super hack -- to account for the fact that we added an extra 'nil'
  # instruction at the very end of the user's code, we will set the
  # final instruction's line number to the last line of the file
  # (only do this if the trace isn't a single element, which likely
  # indicates some sort of uncaught_exception)
  if cur_trace.length > 1 && n_lines_added
    cur_trace[-1]['line'] -= n_lines_added
  end

  # postprocessing into a trace
  trace_json = JSON.pretty_generate(res)
  if trace_output_fn == 'stdout'
    STDOUT.write(trace_json)
  else
    File.open(trace_output_fn, 'w') do |f|
      f.write('var trace = ' + trace_json)
    end
    puts "Trace written to " + trace_output_fn
  end
end
