# Adapted from http://www.reactive.io/tips/2008/12/21/understanding-ruby-blocks-procs-and-lambdas/

def args(code)
  one, two = 1, 2
  code.call(one, two)
end

args(Proc.new{|a, b, c| puts "Give me a #{a} and a #{b} and a #{c.class}"})
# lambdas check number of args while Procs don't
args(lambda{|a, b, c| puts "Give me a #{a} and a #{b} and a #{c.class}"})
