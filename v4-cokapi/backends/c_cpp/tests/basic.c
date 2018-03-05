#include <stdio.h>
#include <stdlib.h>

int bar(int, int, int, int);

int foo(short a, unsigned int b, char* unused_str) {
  int c = bar(a, b, -2 * a, -2 * b);
  return c;
}

int bar(int x, int y, int z, int w) {
  int qqq = x + y + z + w;
  return qqq;
}

int main() {
  int ret = foo(123, 321, "hello world"); // TODO: what do we do about 'global' string literals?!?
  printf("ret = %d\n", ret);

  char stack_str[10]; stack_str[0] = 'q'; stack_str[1] = 'z'; stack_str[2] = '!';
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

  // point it to the middle
  heap_str++;
  heap_str++;
  heap_str++;

  unsigned short* heap_shorts = (unsigned short*)malloc(11 * sizeof(*heap_shorts));
  heap_shorts[1] = 1;
  heap_shorts[3] = 3;
  heap_shorts[5] = 5;
  heap_shorts[7] = 7;
  heap_shorts[9] = 9;

  // point it to the middle
  heap_shorts++;
  heap_shorts++;
  heap_shorts++;

  ret = foo(333, 444, stack_str);
  printf("ret = %d\n", ret);
  return 42;
}
