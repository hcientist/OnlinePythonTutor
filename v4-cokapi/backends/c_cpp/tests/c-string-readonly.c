// error when writing to readonly memory
void change( char a[] ) {
  a[0] = 'B';
  a[1] = 'y';
  a[2] = 'e';
  a[3] = '\0';
}

int main() {
  change("Hello");
  return 0;
}
