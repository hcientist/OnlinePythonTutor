# Adapted from Learning Ruby by Michael Fitzgerald, O'Reilly

count = Proc.new {
  [1,2,3,4,5].each {
    |i| print i
  }
  puts
}

your_proc = lambda { puts "Lurch: 'You rang?'" }
my_proc = proc { puts "Morticia: 'Who was at the door, Lurch?'" }

puts count.class, your_proc.class, my_proc.class

count.call
your_proc.call
my_proc.call
