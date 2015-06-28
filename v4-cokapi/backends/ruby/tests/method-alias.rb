# Adapted from Learning Ruby by Michael Fitzgerald, O'Reilly

def greet
  puts "Hello!"
end

alias greet2 greet

greet
greet2
puts greet.object_id # odd ... actually runs the method before calling object_id
puts greet2.object_id
