void foo() {
  static int wxyz = 42;
}

void main() {
  foo();
  static int wxyz = 12345;
  if (1) {
    static int wxyz = 54321;
    printf("%d\n", wxyz);
  }
}
