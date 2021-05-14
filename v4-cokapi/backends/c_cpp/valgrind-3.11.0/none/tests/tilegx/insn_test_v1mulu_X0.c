//file: _insn_test_v1mulu_X0.c
//op=265
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

unsigned long mem[2] = { 0xc6ae3df2f165e603, 0x4124d3b9cd881478 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r27, -8005\n"
                      "shl16insli r27, r27, 29496\n"
                      "shl16insli r27, r27, 24596\n"
                      "shl16insli r27, r27, 10312\n"
                      "moveli r8, -21695\n"
                      "shl16insli r8, r8, 9862\n"
                      "shl16insli r8, r8, -14356\n"
                      "shl16insli r8, r8, -32187\n"
                      "moveli r13, -16854\n"
                      "shl16insli r13, r13, 30079\n"
                      "shl16insli r13, r13, -7543\n"
                      "shl16insli r13, r13, 13209\n"
                      "{ v1mulu r27, r8, r13 ; fnop   }\n"
                      "move %0, r27\n"
                      "move %1, r8\n"
                      "move %2, r13\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
