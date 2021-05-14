# how does lexical scoping work for blocks?

x = 5

def gimme
  y = 10
  yield
  puts "Done!"
end

gimme do
  puts x
  x += 100 # can modify x in enclosing scope
  puts x
end

puts x
