# Adapted from Learning Ruby by Michael Fitzgerald, O'Reilly

def num_args(x, y, *args)
  length = args.size
  label = length == 1 ? " vararg" : " varargs"
  length.to_s + label + " ( " + args.inspect + " )" # implicit return
end

puts num_args 'myX', 'myY'
puts num_args 'myX', 'myY', 1
puts num_args('myX', 'myY', 100, 2.5, "three")
