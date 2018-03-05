// from john regehr
struct s {
  int *p1, *p2;
};

int main(void) {
  struct s a;
  struct s *b = malloc(sizeof(struct s));
  a.p1 = &b->p2;
  a.p2 = &b->p1;
  b->p1 = &a.p2;
  b->p2 = &a.p1;
  return 0;
}
