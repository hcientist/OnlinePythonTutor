// simplified from the test suite of https://github.com/codespecs/daikon
//   daikon/tests/kvasir-tests/
const int DIM1 = 3;
const int DIM2 = 4;

int main() {
  int x[DIM1][DIM2];
  int i, j;
  for (i = 0; i < DIM1; i++)
    for(j = 0; j < DIM2; j++)
      x[i][j] = i+j*i;
}
