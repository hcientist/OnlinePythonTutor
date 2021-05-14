#include <stdlib.h>

int main() {
  int* x = (int*)malloc(2*sizeof(*x));
  x[100] = 10;   // invalid write
  int y = x[10]; // invalid read
}
