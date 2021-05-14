# Adapted from http://www.reactive.io/tips/2008/12/21/understanding-ruby-blocks-procs-and-lambdas/

class Array
  def iterate!
    self.each_with_index { |n, i|
      self[i] = yield(n)
    }
  end

  # & turns cod from a block to a proc, which has a call() method
  def iterate_proc!(&cod)
    self.each_with_index { |n, i|
      self[i] = cod.call(n)
    }
  end
end

array = [1, 2, 3, 4]

array.iterate! { |n| n ** 2 }
puts array.inspect

array.iterate_proc! { |n| n + 100 }
puts array.inspect
