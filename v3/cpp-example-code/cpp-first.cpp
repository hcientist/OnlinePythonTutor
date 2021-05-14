// Example C++ code for OPT
int main() {
  int *x = new int;
  int *x_array = new int[10];

  x_array[1] = 1;
  x_array[3] = 3;
  x_array[5] = 5;

  delete x;
  delete[] x_array;
  return 0;
}
