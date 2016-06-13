# how does lexical scoping work for blocks?

x = 5

def gimme
  y = 10
  yield
  puts "You're welcome."
end

gimme do
  puts x
  x += 100 # can modify x in enclosing scope
  puts x
  puts y # can't find y since this is lexically scoped
end
