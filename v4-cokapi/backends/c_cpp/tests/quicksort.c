// From http://www.comp.dit.ie/rlawlor/Alg_DS/sorting/quickSort.c
#include <stdio.h>

void quickSort(int[], int, int);
int partition(int[], int, int);

int main() {
  int a[] = {7, 12, 1, -2, 0, 15, 4, 11, 9};
  quickSort(a, 0, 8);
  return 0;
}

void quickSort( int a[], int l, int r) {
  int j;
  if(l < r) {
    j = partition(a, l, r);
    quickSort(a, l, j-1);
    quickSort(a, j+1, r);
  }
}

int partition(int a[], int l, int r) {
  int pivot, i, j, t;
  pivot = a[l];
  i = l; j = r+1;
    
  while(1) {
    do ++i; while (a[i] <= pivot && i <= r);
    do --j; while (a[j] > pivot);
    if (i >= j) break;
    t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  t = a[l];
  a[l] = a[j];
  a[j] = t;
  return j;
}
