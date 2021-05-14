int main() {
  volatile int foo = 111; 
  unsigned long int volatile bar = 222;
  const volatile int* baz = &foo;
  volatile const unsigned long int* rt_clk = &bar;
}
