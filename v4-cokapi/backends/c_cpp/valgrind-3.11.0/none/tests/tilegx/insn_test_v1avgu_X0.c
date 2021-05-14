//file: _insn_test_v1avgu_X0.c
//op=237
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

unsigned long mem[2] = { 0xeaf60994f1256f, 0x96d7d7579295561d };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r43, 31333\n"
                      "shl16insli r43, r43, 15554\n"
                      "shl16insli r43, r43, 16035\n"
                      "shl16insli r43, r43, -6284\n"
                      "moveli r15, -6999\n"
                      "shl16insli r15, r15, -24670\n"
                      "shl16insli r15, r15, -31990\n"
                      "shl16insli r15, r15, -6084\n"
                      "moveli r9, -29195\n"
                      "shl16insli r9, r9, -14971\n"
                      "shl16insli r9, r9, 21267\n"
                      "shl16insli r9, r9, -6933\n"
                      "{ v1avgu r43, r15, r9 ; fnop   }\n"
                      "move %0, r43\n"
                      "move %1, r15\n"
                      "move %2, r9\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
