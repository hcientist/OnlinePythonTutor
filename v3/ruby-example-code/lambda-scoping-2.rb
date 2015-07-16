# how does lexical scoping work for lambdas?

x = 5

p = lambda {
  puts x
  x += 100 # can modify x in enclosing scope
  puts x
  puts 'end of p'
}

def gimme
  x = 10
  print 'In gimme, x is '
  puts x
  yield
  puts "You're welcome."
  print 'In gimme, x is '
  puts x
end

gimme &p # use '&' to turn a lambda into a block
print 'In main, x is '
puts x
