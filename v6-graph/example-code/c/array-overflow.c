// Example C code for OPT
#include <stdio.h>

void foo(int* x) {
  printf("%d\n", x[3]);
}

int main() {
  int arr[3];
  int overflow = 1000;
  arr[0] = 10;
  arr[1] = 20;
  arr[2] = 30;
  foo(arr);
  return 0;
}
