int main() {
  int i;
  int* x = (int*)malloc(10*sizeof(*x));
  for (i = 0; i < 20; i++)
    x[i] = i * i;
}
