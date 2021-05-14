// Example C code for OPT
// From: http://stackoverflow.com/questions/2124600/how-to-reverse-a-string-in-place-in-c-using-pointers
#include <string.h>
#include <stdlib.h>

void reverse(char *s) {
  char *end = s + (strlen(s) - 1);
  for(; end > s; --end, ++s) {
    (*s) ^= (*end);
    (*end) ^= (*s);
    (*s) ^= (*end);
  }
}

int main() {
  char *x = malloc(20);
  strcpy(x, "Hello world!");
  reverse(x);
  return 0;
}
