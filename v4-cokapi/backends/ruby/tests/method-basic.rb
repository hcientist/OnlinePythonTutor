# Adapted from Learning Ruby by Michael Fitzgerald, O'Reilly

def repeat(word, times)
  puts (word + ' ') * times
end

repeat 'hello', 5
repeat 'goodbye', 3
undef repeat
# 'repeat' should no longer be in scope
repeat 'broken', 5
