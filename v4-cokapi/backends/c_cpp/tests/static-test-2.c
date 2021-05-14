static int x = 123;
void foo() {
  static int x=0;
  x+=10;
}

int main() {
  static int x = 456;
  int y = 789;
  foo();
  foo();
  foo();
}
