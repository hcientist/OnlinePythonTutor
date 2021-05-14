# adapted from http://rubylearning.com/satishtalim/ruby_constants.html

# p057mymethods2.rb  
# variables and methods start lowercase  
$glob = 5             # global variables start with $  
class TestVar         # class name constant, start uppercase  
 @@cla = 6            # class variables start with @@  
 CONST_VAL = 7        # constant style, all caps, underscore  
 def initialize(x)    # constructor  
  @inst = x           # instance variables start with @  
  @@cla += 1          # each object shares @@cla  
 end  
 def self.cla         # class method, getter  
  @@cla  
 end  
 def self.cla=(y)     # class method, setter, also TestVar.  
  @@cla = y  
 end  
 def inst             # instance method, getter  
  @inst  
 end  
 def inst=(i)         # instance method, setter  
  @inst = i  
 end  
end  
puts $glob  
test = TestVar.new(3) # calls constructor  
puts TestVar.cla      # calls getter  
puts test.inspect     # gives object ID and instance vars  
TestVar.cla = 4       # calls setter  
test.inst=8           # calls setter  
puts TestVar.cla  
puts test.inst        # calls getter  
other = TestVar.new(17)  
puts other.inspect  
puts TestVar.cla  
