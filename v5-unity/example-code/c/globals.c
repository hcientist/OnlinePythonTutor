// Example C code for OPT
// adapted from pg's meng thesis

int globalInt = 42;
char* globalStr = "hello\nworld\tagain!\n\n\n";
char globalChar = 'x';
double globalDouble = 3.14159;
int globalIntArray[7];

int main() {
  int *a = &globalInt;
  char* aliasGlobalStr = globalStr;

  globalIntArray[0] = 100;
  globalIntArray[2] = 200;
  globalIntArray[4] = 300;
  globalIntArray[6] = 400;

  // increment it!
  aliasGlobalStr++;
  aliasGlobalStr++;
  aliasGlobalStr++;
  aliasGlobalStr++;
  aliasGlobalStr++;

  return 0;
}
