# Ruby backend for Online "Python" Tutor
# created on 2015-06-29 by Philip Guo
#
# WARNING: this script only works on a *hacked version* of Ruby 2.X since
# we use the TracePoint API and custom fields such as binding::frame_id.
# See custom-ruby-interpreter/ for details.

# simple Ruby idiom for assert:
# raise "error msg" unless <condition to assert>

# TODO
# - display constants defined INSIDE OF modules or classes
# - display class and instance variables
# - display the 'binding' within a proc/lambda object, which represents
#   its closure
# - toplevel methods, instance, and class variables belong to 'Object',
#   so how do we cleanly visualize this? maybe with a special 'Object'
#   frame?!?
# - support gets() for user input using the restart hack mechanism
#   - user input stored in $_
# - support 'include'-ing a module and bringing in variables into namespace
# - get rid of fake 'nil' on final line and adjust line numbers
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
require 'binding_of_caller' # gem install binding_of_caller


script_name = ARGV[0]
cod = File.open(script_name).read

trace_output_fn = ARGV[1] || "../../../v3/test-trace.js"

cur_trace = []
res = {'code' => cod, 'trace' => cur_trace}

# canonicalize to pretty-print
cur_frame_id = 1
ordered_frame_ids = {}

stdout_buffer = StringIO.new

n_steps = 0
#MAX_STEPS = 30
MAX_STEPS = 300

class MaxStepsException < RuntimeError
end


# collect the sets of these variables RIGHT BEFORE the user's code runs
base_globals_set = global_variables
base_constants_set = Module.constants


pg_tracer = TracePoint.new(:line,:class,:end,:call,:return,:raise,:b_call,:b_return) do |tp|
  next if tp.path != '(eval)' # 'next' is a 'return' from a block

  # instruction_limit_reached - if you want to cap execution at a
  # certain limit (e.g., 300 executed steps), issue this special event
  # at the end. fill in the exception_msg field to say something like
  # "(stopped after N steps to prevent possible infinite loop)"
  raise MaxStepsException if n_steps >= MAX_STEPS # TODO: xxx

  STDERR.puts '---'
  STDERR.puts [tp.event, tp.lineno, tp.path, tp.defined_class, tp.method_id].inspect
  # TODO: look into tp.defined_class and tp.method_id attrs

  retval = nil
  if tp.event == :return || tp.event == :b_return
    STDERR.print 'RETURN!!! '
    STDERR.puts tp.return_value.inspect
    retval = tp.return_value.inspect # TODO: make into true objects later
  end

  if tp.event == :raise
    STDERR.print 'RAISE!!! '
    STDERR.puts tp.raised_exception.inspect
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
  STDERR.print 'stdout: '
  STDERR.puts entry['stdout']

  stack = []
  heap = {} # TODO: xxx
  entry['stack_to_render'] = stack
  entry['heap'] = heap

  # globals
  globals = {}
  entry['globals'] = globals

  true_globals = (global_variables - base_globals_set) # set difference
  STDERR.print 'Globals: '
  STDERR.puts true_globals.inspect
  entry['ordered_globals'] = true_globals.map { |e| e.to_s }

  true_globals.each.with_index do |varname, i|
    val = eval(varname.to_s) # TODO: is there a better way? this seems hacky!
    STDERR.print varname, ' -> ', val.inspect
    STDERR.puts
    globals[varname.to_s] = val.inspect # TODO: make into true objects later
  end

  # toplevel constants (stuff them in globals)
  toplevel_constants = (Module.constants - base_constants_set) # set difference
  STDERR.print 'Constants: '
  STDERR.puts toplevel_constants.inspect
  entry['ordered_globals'] += toplevel_constants.map { |e| e.to_s }
  toplevel_constants.each.with_index do |varname, i|
    val = eval(varname.to_s) # TODO: is there a better way? this seems hacky!
    STDERR.print varname, ' -> ', val.inspect
    STDERR.puts
    globals[varname.to_s] = val.inspect # TODO: make into true objects later
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
      stack << stack_entry

      stack_entry['is_highlighted'] = false # set the last entry to true later

      iseq = dc.frame_iseq(i)
      raise "WTF WTF WTF?!?" unless iseq

      b = dc.frame_binding(i)

      # frame_id field exists only in my hacked Ruby interpreter!
      canonical_fid = ordered_frame_ids[b.frame_id]
      if !canonical_fid
        canonical_fid = cur_frame_id
        ordered_frame_ids[b.frame_id] = cur_frame_id
        cur_frame_id += 1
      end

      boc = binding.of_caller(i+1) # need +1 for some reason

      # hacky since we use of_caller -- make sure it looks legit
      STDERR.print 'frame_description: '
      STDERR.puts boc.frame_description
      STDERR.print 'frame_type: '
      STDERR.puts boc.frame_type # 'eval', 'method', 'block'

      stack_entry['func_name'] = boc.frame_description # TODO: integrate 'frame_type' too?

      STDERR.print 'frame_id: '
      STDERR.puts canonical_fid
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

      STDERR.print '>>> ', loc, ' ', lvs, lvs_val
      STDERR.puts
      STDERR.puts
    end
  end

  STDERR.puts

  # massage the topmost stack entry
  if stack
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
  # - however, we need to patch up the line number and set event type to
  #   'return' for the final line's execution.
  # - this isn't a 'real' line number in the user's code since we've
  #   inserted an extra line
  cod << "\nnil"

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

  # TODO: put syntax error information on trace
  #   "If the trace has exactly 1 entry and it's an uncaught_exception, then
  #   the OPT frontend doesn't switch to the visualization at all ...
  #   instead it displays a "syntax error"-like thingy in the code editor.
  #   It will highlight the faulting line, indicated by the line field and
  #   display exception_msg there. So if you want to indicate a syntax
  #   error, then create a trace with exactly ONE entry that's an
  #   uncaught_exception. (If there's more than one trace entry and the last
  #   one happens to be uncaught_exception, then right now OPT still won't
  #   switch to the visualization and instead issue an error message. TODO:
  #   figure out what's a more desirable behavior here.)"
rescue MaxStepsException
  $stdout = STDOUT
  puts "MaxStepsException -- OOOOOOOOOOOOOOOOOOOOOOOOOHHHHHHH!!!"
rescue
  $stdout = STDOUT
  puts "other exception -- EEEEEEEE!!!"
  puts $!
  # ignore since we've already handled a :raise event by now
ensure
  $stdout = STDOUT
  #STDERR.puts JSON.pretty_generate(cur_trace) # pretty-print hack

  # postprocessing into a trace
  trace_json = JSON.pretty_generate(res)
  File.open(trace_output_fn, 'w') do |f|
    f.write('var trace = ' + trace_json)
  end

  puts "Trace written to " + trace_output_fn
end
