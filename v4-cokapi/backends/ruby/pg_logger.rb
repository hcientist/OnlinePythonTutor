# Ruby backend for Online "Python" Tutor
# created on 2015-06-29 by Philip Guo
#
# only works on Ruby 2.X since we use the TracePoint API

# simple Ruby idiom for assert:
# raise "error msg" unless <condition to assert>

require 'json'

script_name = ARGV[0]

cur_trace = []

pg_tracer = TracePoint.new(:line,:class,:end,:call,:return,:raise,:b_call,:b_return) do |tp|
  if tp.path != '(eval)' then next end # 'next' is a 'return' from a block
  p [tp.event, tp.lineno, tp.path, tp.defined_class, tp.method_id]
  # TODO: look into tp.defined_class and tp.method_id attrs
  # TODO: look into tp.raised_exception and tp.return_value attrs
end

pg_tracer.enable
eval(File.open(script_name).read) # filename is called '(eval)'
pg_tracer.disable
