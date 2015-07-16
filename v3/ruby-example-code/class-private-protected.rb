class MyClass
  def foo; end # instance method
  def self.foo; end # class method

  protected

  def bar; end
  def self.bar; end # NOP!

  # variables shouldn't be affected
  @@classVarX = 111
  @instVarX = 222
  
  private

  @@classVarY = 333
  @instVarY = 444
  
  def baz; end
  def self.baz; end # NOP!

  # dynamically change visibility
  public :baz
  private :bar
  private :foo

  private_class_method :foo
  private_class_method :bar
  private_class_method :baz
end
