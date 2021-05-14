# how does lexical scoping work for Procs?

x = 5

p = Proc.new do
  puts x
  x += 100 # can modify x in enclosing scope
  puts x
  puts 'end of p'
end

def gimme
  x = 10
  print 'In gimme, x is '
  puts x
  yield
  puts "You're welcome."
  print 'In gimme, x is '
  puts x
end

gimme &p # use '&' to turn a Proc into a block
print 'In main, x is '
puts x
