# Adapted from http://www.reactive.io/tips/2008/12/21/understanding-ruby-blocks-procs-and-lambdas/

def callbacks(procs)
  procs[:starting].call

  puts "Still going"

  procs[:finishing].call
end

h = {:starting => Proc.new { puts "Starting" },
     :finishing => Proc.new { puts "Finishing" }}

callbacks(h)
