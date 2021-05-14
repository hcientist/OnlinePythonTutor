// Example C code for OPT
#include <stdlib.h>

// from pg's meng thesis
int globalInt = 42;

int main() {
  int localArray[10]; // contents uninitialized
  int *a, *b, *c, i, j; // c and j uninitialized, *c is meaningless
  a = &globalInt;
  b = (int*)malloc(15*sizeof(int));
  // Heap buffer overflow after i = 14
  for (i = 1; i < 100; i+=2) {
    b[i] = i; // Initialize only odd-indexed elements of b
  }
  return 0;
}
