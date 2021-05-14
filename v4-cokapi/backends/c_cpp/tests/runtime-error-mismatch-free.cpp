#include <stdlib.h>

int main()
{
  char* arr = (char*)malloc(10);
  delete arr; // mismatch
  int x = 42;
}
