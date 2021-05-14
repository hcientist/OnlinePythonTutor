//file: _insn_test_mul_hs_hu_X0.c
//op=156
#include <stdio.h>
#include <stdlib.h>

void func_exit(void) {
     printf("%s\n", __func__);
     exit(0);
}

void func_call(void) {
     printf("%s\n", __func__);
     exit(0);
}

unsigned long mem[2] = { 0x31d131ae6b7da416, 0x3e01995aa9302c9b };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r35, 4550\n"
                      "shl16insli r35, r35, 29355\n"
                      "shl16insli r35, r35, 30941\n"
                      "shl16insli r35, r35, 29755\n"
                      "moveli r7, -18630\n"
                      "shl16insli r7, r7, -31252\n"
                      "shl16insli r7, r7, -15964\n"
                      "shl16insli r7, r7, 8400\n"
                      "moveli r22, 29514\n"
                      "shl16insli r22, r22, 14828\n"
                      "shl16insli r22, r22, 1013\n"
                      "shl16insli r22, r22, 14302\n"
                      "{ mul_hs_hu r35, r7, r22 ; fnop   }\n"
                      "move %0, r35\n"
                      "move %1, r7\n"
                      "move %2, r22\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
