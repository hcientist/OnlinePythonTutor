# adapted from http://rubylearning.com/satishtalim/ruby_constants.html

OUTER_CONST = 99  
  
class Const  
    def get_const  
      CONST  
    end  
    CONST = OUTER_CONST + 1  
end  
  
puts Const.new.get_const  
puts Const::CONST  
puts ::OUTER_CONST  
puts Const::NEW_CONST = 123  
