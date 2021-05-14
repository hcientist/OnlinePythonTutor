void foo(int* a) { // a should point to x
}

int main() {
  static int x[] = {1,2,3,4,5};
  foo(x);
}
