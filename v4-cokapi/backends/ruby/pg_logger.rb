# Ruby backend for Online "Python" Tutor
# created on 2015-06-29 by Philip Guo
#
# only works on Ruby 2.X since we use the TracePoint API

script_name = ARGV[0]

trace = TracePoint.new(:line,:class,:end,:call,:return,:raise,:b_call,:b_return) do |tp|
  if tp.path == '(eval)'
    p [tp.event, tp.lineno]
  end
end

trace.enable
eval(File.open(script_name).read) # filename is called '(eval)'
trace.disable
