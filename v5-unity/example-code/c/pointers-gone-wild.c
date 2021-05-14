// Example C code for OPT
#include <stdlib.h>
int* foo() {
  int local_x = 42;
  int* retval = &local_x; // uh oh
  return retval;
}

int main() {
  int* null_p = NULL;
  int* random_p = (int*)123;

  int* heap_p;
  int** uninit_pp = &heap_p;

  heap_p = malloc(5 * sizeof(*heap_p));
  int* cur_p = heap_p;
  cur_p++;
  cur_p++;
  cur_p++;
  cur_p++;
  cur_p++;
  cur_p++;
  cur_p++;
  cur_p++;
  free(heap_p);
  heap_p = NULL;

  int* stack_p = foo();
}
