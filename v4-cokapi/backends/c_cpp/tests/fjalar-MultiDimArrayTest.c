// simplified from the test suite of https://github.com/codespecs/daikon
//   daikon/tests/kvasir-tests/

#include <stdio.h>

const int DIM1 = 3;
const int DIM2 = 4;

struct boo {
  int a;
  int b;
  int c[4][5];
  int* d[9][7];
};

struct boo globalBoo;

void fint(int param[DIM1][DIM2]) {
  return;
}

void __attribute__(()) fcrashint(int param[10][5], struct boo booParam) {
  printf("fcrashint: &param=%p &booParam=%p, diff=%d\n",
         &param, &booParam, (void*)&booParam - (void*)&param);
};

int main() {
  int x[DIM1][DIM2];
  int i, j;
  for (i = 0; i < DIM1; i++)
    for(j = 0; j < DIM2; j++)
      x[i][j] = i+j*i;
  globalBoo.a = 42;
  globalBoo.b = 9876;
  globalBoo.c[0][0] = 12345;
  globalBoo.c[1][0] = 54321;
  globalBoo.c[2][0] = 42;
  fint(x);
  fcrashint(x, globalBoo);
  return 0;
}
