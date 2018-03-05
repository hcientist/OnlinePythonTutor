int foo() {
  return 42;
}

int bar() {
  return "honey";
}

int baz() {return "bazzz";}

int main() {
  printf("%d %s: %s\n", foo(), bar(), baz());
}
