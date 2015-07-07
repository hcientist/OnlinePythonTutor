# Ruby backend for Online "Python" Tutor
# created on 2015-06-29 by Philip Guo
#
# only works on Ruby 2.X since we use the TracePoint API

# simple Ruby idiom for assert:
# raise "error msg" unless <condition to assert>

# TODO
# - catch exceptions so that the tracer doesn't crash on an exception
# - render exception events properly
# - limit execution to N steps -- use instruction_limit_reached event type
# - catch the execution of the LAST line in a user's script
# - display TRUE global $variables rather than just locals of the top-most frame
# - support recursive calls with function frame ids
#   - maybe i need a stupid C extension to expose the pointer address of
#     each frame object in the interpreter?!? ugh that would be a giant pain
#     - maybe just modify this file to expose the 'cfp' pointer?
#        https://github.com/banister/binding_of_caller/blob/master/ext/binding_of_caller/binding_of_caller.c
#   - or recompile Ruby where the backtrace exposes the frame pointer address
#
# Limitations:
# - no support for (lexical) environment pointers, since MRI doesn't seem to
#   expose them. We can see only the current (dynamic) stack backtrace
#   with debug_inspector.

# style guide: https://github.com/styleguide/ruby


require 'json'
require 'debug_inspector' # gem install debug_inspector, use on Ruby 2.X
require 'binding_of_caller' # gem install binding_of_caller

script_name = ARGV[0]
cod = File.open(script_name).read

trace_output_fn = ARGV[1] || "../../../v3/test-trace.js"

cur_trace = []
res = {'code' => cod, 'trace' => cur_trace}

cur_frame_id = 1

pg_tracer = TracePoint.new(:line,:class,:end,:call,:return,:raise,:b_call,:b_return) do |tp|
  next if tp.path != '(eval)' # 'next' is a 'return' from a block

  puts '---'

  # inject a frame_id variable into the function's frame
  if tp.event == :call || tp.event == :b_call
    puts 'CALLLL'
    # ughhhh, I can't seem to create a new local variable using
    # of_caller, although I can modify existing locals
    # crappp instance variables are kinda 'global'
    binding.of_caller(1).eval('@frame_id = ' + cur_frame_id.to_s)
    puts binding.of_caller(1).eval('@frame_id')
    #puts b.methods - Object.methods
    #puts b.frame_type, b.frame_description, b.callers
    #puts
    cur_frame_id += 1
  end

  p [tp.event, tp.lineno, tp.path, tp.defined_class, tp.method_id]
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

  # adapted from https://github.com/ko1/pretty_backtrace/blob/master/lib/pretty_backtrace.rb
  def self.iseq_local_variables iseq
    _,_,_,_,arg_info,name,path,a_path,_,type,lvs, * = iseq.to_a
    lvs
  end

  # TODO: use binding.of_caller(1) and get frame_type and
  # frame_description properties to print out frame names

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

      #modify_trace_line loc, loc.absolute_path, loc.lineno, lvs_val

      print '>>> ', loc, ' ', lvs_val
      puts
    end
  end

  puts

  cur_trace << entry
end

pg_tracer.enable
eval(cod) # the filename of the user's code is '(eval)'
pg_tracer.disable

#puts JSON.pretty_generate(cur_trace) # pretty-print hack

# postprocessing into a trace
trace_json = JSON.generate(res)
File.open(trace_output_fn, 'w') do |f|
  f.write('var trace = ' + trace_json)
end

puts "Trace written to " + trace_output_fn
