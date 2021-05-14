# how does lexical scoping work for Procs?

x = 5

p = Proc.new do
  puts x
  x += 100 # can modify x in enclosing scope
  puts x
  puts 'end of p'
end

p.call
puts x
