# Adapted from http://www.reactive.io/tips/2008/12/21/understanding-ruby-blocks-procs-and-lambdas/

def generic_return(code)
  one, two    = 1, 2
  three, four = code.call(one, two)
  return "Give me a #{three} and a #{four}"
end

puts generic_return(lambda { |x, y| return x + 2, y + 2 })

puts generic_return(Proc.new { |x, y| x + 2; y + 2 })

puts generic_return(Proc.new { |x, y| [x + 2, y + 2] })

# runtime error -- cannot have 'return' in here ...
puts generic_return(Proc.new { |x, y| return x + 2, y + 2 })
