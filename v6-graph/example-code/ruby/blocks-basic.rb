# Adapted from Learning Ruby by Michael Fitzgerald, O'Reilly

def gimme
  if block_given?
    yield
  else
    print "Oops, no block."
  end
  puts " You're welcome."
end

gimme { print "Thank you." }

gimme do
  localX = "Thank you again."
  print localX
end

gimme # no block
