# adapted from http://cirw.in/blog/constant-lookup.html

module A
  module B; end
  module C
    module D
      puts B
      puts A::B
    end
  end
end
