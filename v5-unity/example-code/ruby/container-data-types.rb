require 'set'

my_array = [1, 2, 3, 'hello', false, true, nil]
my_hash = {'John' => 26, 'Jane' => 21, 'Jack' => 30}
my_set = my_array.to_set

my_hash['nested array'] = my_array
my_array[1] = ['a', 'b', 'c']
