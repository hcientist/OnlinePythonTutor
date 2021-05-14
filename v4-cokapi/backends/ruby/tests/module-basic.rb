# adapted from http://ruby-doc.org/core-2.2.0/Module.html
module Mod
  include Math
  CONST = 42
  def meth
    puts "hello world"
  end
end
