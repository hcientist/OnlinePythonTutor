# how does lexical scoping work for blocks?

x = 5

def gimme
  yield
  puts "end of gimme"
end

def bar
  y = 42
  gimme do
    # everything inside of here can access y but *not* x
    puts 'Hello'
    puts y
    y += 1000
    puts y
  end
  puts 'end of bar'
  puts y
end

bar
