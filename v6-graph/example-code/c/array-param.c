// Example C code for OPT
#include <stdlib.h>

int arrayParams(short short_array[5] /* incorrect bound */, char char_array[]) {
  printf(char_array);
  return 0;
}

int main() {
  short stack_shorts[10];
  stack_shorts[1] = 1;
  stack_shorts[3] = 3;
  stack_shorts[5] = 5;
  stack_shorts[7] = 7;
  stack_shorts[9] = 9;

  char* heap_str = (char*)malloc(7);
  heap_str[0] = 'B';
  heap_str[1] = 'o';
  heap_str[2] = 'b';
  heap_str[3] = '\0';

  arrayParams(stack_shorts, heap_str);
  return 0;
}
