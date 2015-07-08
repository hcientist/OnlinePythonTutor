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
# - render exception events properly
# - limit execution to N steps -- use instruction_limit_reached event type
# - catch the execution of the LAST line in a user's script
# - display TRUE global $variables rather than just locals of the top-most frame
# - support recursive calls with function frame ids
#   - TODO: use my custom binding::frame_id field
#
# Limitations:
# - no support for (lexical) environment pointers, since MRI doesn't seem to
#   expose them. We can see only the current (dynamic) stack backtrace
#   with debug_inspector.

# style guide: https://github.com/styleguide/ruby


require 'json'
require 'debug_inspector' # gem install debug_inspector, use on Ruby 2.X
#require 'binding_of_caller' # gem install binding_of_caller

script_name = ARGV[0]
cod = File.open(script_name).read

trace_output_fn = ARGV[1] || "../../../v3/test-trace.js"

cur_trace = []
res = {'code' => cod, 'trace' => cur_trace}

cur_frame_id = 1
ordered_frame_ids = {}

pg_tracer = TracePoint.new(:line,:class,:end,:call,:return,:raise,:b_call,:b_return) do |tp|
  next if tp.path != '(eval)' # 'next' is a 'return' from a block

  puts '---'

  # inject a frame_id variable into the function's frame
  if tp.event == :call || tp.event == :b_call
    puts 'CALLLL'
    #new_frame_id = binding.of_caller(1).frame_id
    #raise "Error: duplicate new_frame_id" unless !ordered_frame_ids.has_key?(new_frame_id)
    # canonicalize it
    #ordered_frame_ids[new_frame_id] = cur_frame_id
    #cur_frame_id += 1
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

        # canonicalize to pretty-print
        canonical_fid = ordered_frame_ids[b.frame_id]
        if !canonical_fid
          canonical_fid = cur_frame_id
          ordered_frame_ids[b.frame_id] = cur_frame_id
          cur_frame_id += 1
        end

        print 'frame_id: '
        puts canonical_fid

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
