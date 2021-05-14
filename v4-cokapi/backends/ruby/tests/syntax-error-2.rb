def say_hi
  if @names.nil?
    puts "..."
  else if @names.respond_to?("each") # 'else if' is wrong
    @names.each do |name|
      puts "Hello #{name}!"
    end
  end
end
