# Adapted from Learning Ruby by Michael Fitzgerald, O'Reilly

def foo
  'implicit return string'
end

x = foo
puts x

def bar
  'nop string'
  return 'explicit return string'
end

y = bar
puts y
