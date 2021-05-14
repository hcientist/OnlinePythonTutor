# Adapted from Ruby in Twenty Minutes
# https://www.ruby-lang.org/en/documentation/quickstart/3/

class MegaGreeter
  attr_accessor :names

  # Create the object
  def initialize(names = "World")
    @names = names
  end

  # Say hi to everybody
  def say_hi
    if @names.nil?
      puts "..."
    elsif @names.respond_to?("each")
      # @names is a list of some kind, iterate!
      @names.each do |name|
        puts "Hello #{name}!"
      end
    else
      puts "Hello #{@names}!"
    end
  end
end


mg = MegaGreeter.new
mg.say_hi

# Change name to be "Zeke"
mg.names = "Zeke"
mg.say_hi

# Change the name to an array of names
mg.names = ["Albert", "Brenda", "Charles",
  "Dave", "Engelbert"]
mg.say_hi

# Change to nil
mg.names = nil
mg.say_hi
