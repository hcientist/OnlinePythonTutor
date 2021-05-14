typedef struct {
  int foo_int;
  char* foo_str;
  double foo_double;
  void* foo_baz; // This should be observed as type baz
} foo;

typedef struct {
  int baz_int;
  char baz_str[10];
} baz;

int main() {
  foo* f = (foo*)malloc(sizeof(*f));
  f->foo_double = 2.718;
  f->foo_baz = (void*)malloc(sizeof(baz));
  return 0;
}
