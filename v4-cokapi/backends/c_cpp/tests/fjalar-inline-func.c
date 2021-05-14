// From the test suite of https://github.com/codespecs/daikon
//   daikon/tests/kvasir-tests/

int foo(int);

inline int foo(int x) {
  return 5;
}

int main() {
  foo(3);
  return 0;
}
