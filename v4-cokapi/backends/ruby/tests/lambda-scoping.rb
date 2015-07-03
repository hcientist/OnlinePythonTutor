# how does lexical scoping work for lambdas?

x = 5

p = lambda {
  puts x
  x += 100 # can modify x in enclosing scope
  puts x
  puts 'end of p'
}

p.call
puts x
