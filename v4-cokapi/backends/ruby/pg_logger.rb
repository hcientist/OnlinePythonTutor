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

# style guide: https://github.com/styleguide/ruby

require 'json'

script_name = ARGV[0]
cod = File.open(script_name).read

trace_output_fn = ARGV[1] || "../../../v3/test-trace.js"

cur_trace = []
res = {'code' => cod, 'trace' => cur_trace}

pg_tracer = TracePoint.new(:line,:class,:end,:call,:return,:raise,:b_call,:b_return) do |tp|
  next if tp.path != '(eval)' # 'next' is a 'return' from a block

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

  # TODO: see http://ruby-doc.org/core-2.2.2/Thread/Backtrace/Location.html
  caller_locations.each do |c|
    puts c
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
