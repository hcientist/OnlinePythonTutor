# Ruby backend for Online "Python" Tutor
# created on 2015-06-29 by Philip Guo
#
# WARNING: this script only works on a *hacked version* of Ruby 2.X since
# we use the TracePoint API and custom fields such as binding::frame_id.
# See custom-ruby-interpreter/ for details.

# simple Ruby idiom for assert:
# raise "error msg" unless <condition to assert>

# TODO
# - catch exceptions so that the tracer doesn't crash on an exception
#   - and render exception events properly
# - display constants, but look into weird constant scoping rules
#   - e.g., see this: http://rubylearning.com/satishtalim/ruby_constants.html
# - display class and instance variables as well, ergh!
#
# Limitations:
# - no support for (lexical) environment pointers, since MRI doesn't seem to
#   expose them. We can see only the current (dynamic) stack backtrace
#   with debug_inspector.

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

cur_frame_id = 1
ordered_frame_ids = {}

stdout_buffer = StringIO.new

basic_global_set = global_variables

n_steps = 0
#MAX_STEPS = 30
MAX_STEPS = 300

class MaxStepsException < RuntimeError
end

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
  # TODO: look into tp.raised_exception and tp.return_value attrs

  evt_type = case tp.event
             when :line then "step_line"
             when :call, :b_call, :class then "call"
             when :return, :b_return, :end then "return"
             when :raise then "exception"
             end

  ordered_globals = []
  globals = {}
  stack = []
  heap = {}

  entry = {}
  entry['func_name'] = tp.method_id
  entry['stdout'] = '' # TODO: xxx - look into StringIO
  entry['ordered_globals'] = ordered_globals
  entry['globals'] = globals
  entry['stack_to_render'] = stack # TODO: xxx
  entry['heap'] = heap
  entry['line'] = tp.lineno
  entry['event'] = evt_type

  STDERR.print 'stdout: '
  STDERR.puts stdout_buffer.string.inspect

  # globals
  prog_globals = (global_variables - basic_global_set)
  STDERR.puts prog_globals.inspect # set difference
  prog_globals.each.with_index do |varname, i|
    val = eval(varname.to_s) # TODO: is there a better way? this seems hacky!
    STDERR.print varname, ' -> ', val
    STDERR.puts
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

      iseq = dc.frame_iseq(i)

      if iseq
        b = dc.frame_binding(i)

        # canonicalize to pretty-print
        canonical_fid = ordered_frame_ids[b.frame_id]
        if !canonical_fid
          canonical_fid = cur_frame_id
          ordered_frame_ids[b.frame_id] = cur_frame_id
          cur_frame_id += 1
        end

        # hacky since we use of_caller -- make sure it looks legit
        STDERR.print 'frame_description: '
        STDERR.puts binding.of_caller(i+1).frame_description

        STDERR.print 'frame_type: '
        STDERR.puts binding.of_caller(i+1).frame_type

        STDERR.print 'frame_id: '
        STDERR.puts canonical_fid

        lvs = iseq_local_variables(iseq)
        lvs_val = lvs.inject({}){|r, lv|
          begin
            v = b.local_variable_get(lv).inspect
            r[lv] = v
          rescue NameError
            # ignore
          end
          r
        }
      else
        lvs_val = {}
      end

      STDERR.print '>>> ', loc, ' ', lvs_val
      STDERR.puts
      STDERR.puts
    end
  end

  STDERR.puts

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
rescue MaxStepsException
  $stdout = STDOUT
  puts "MaxStepsException -- OOOOOOOOOOOOOOOOOOOOOOOOOHHHHHHH!!!"
ensure
  $stdout = STDOUT
  #STDERR.puts JSON.pretty_generate(cur_trace) # pretty-print hack

  # postprocessing into a trace
  trace_json = JSON.generate(res)
  File.open(trace_output_fn, 'w') do |f|
    f.write('var trace = ' + trace_json)
  end

  puts "Trace written to " + trace_output_fn
end
