int main() {
  int* x = malloc(8);
  free(x); // show x pointing to garbage
  x = 0;   // show x pointing to NULL
}
