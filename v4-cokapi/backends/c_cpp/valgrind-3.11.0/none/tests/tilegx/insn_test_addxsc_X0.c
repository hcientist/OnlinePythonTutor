//file: _insn_test_addxsc_X0.c
//op=28
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

unsigned long mem[2] = { 0xd9528fcf37ad6ac6, 0xe41f03815d99ac96 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r16, 27624\n"
                      "shl16insli r16, r16, 3804\n"
                      "shl16insli r16, r16, -16569\n"
                      "shl16insli r16, r16, -19918\n"
                      "moveli r12, -8205\n"
                      "shl16insli r12, r12, 24120\n"
                      "shl16insli r12, r12, 20070\n"
                      "shl16insli r12, r12, 12693\n"
                      "moveli r5, 11830\n"
                      "shl16insli r5, r5, -1700\n"
                      "shl16insli r5, r5, 8629\n"
                      "shl16insli r5, r5, -24868\n"
                      "{ addxsc r16, r12, r5 ; fnop   }\n"
                      "move %0, r16\n"
                      "move %1, r12\n"
                      "move %2, r5\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
