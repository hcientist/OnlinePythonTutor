# adapted from http://rubylearning.com/satishtalim/ruby_inheritance.html
class Mammal  
  def breathe  
    puts "inhale and exhale"  
  end  
end  
  
class Cat < Mammal  
  def speak  
    puts "Meow"  
  end  
end  

class Tabby < Cat
  def speak
    puts "Tabby meow"
  end
end
  
rani = Cat.new  
rani.breathe  
rani.speak

tab = Tabby.new
tab.speak
