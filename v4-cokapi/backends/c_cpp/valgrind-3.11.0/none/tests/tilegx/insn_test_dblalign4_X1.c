//file: _insn_test_dblalign4_X1.c
//op=76
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

unsigned long mem[2] = { 0xb17341a0d542c8a8, 0x2220b583f77f7510 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r41, -25189\n"
                      "shl16insli r41, r41, 30892\n"
                      "shl16insli r41, r41, 12292\n"
                      "shl16insli r41, r41, 9859\n"
                      "moveli r10, -10199\n"
                      "shl16insli r10, r10, -13638\n"
                      "shl16insli r10, r10, 17992\n"
                      "shl16insli r10, r10, -16829\n"
                      "moveli r16, -8310\n"
                      "shl16insli r16, r16, -28931\n"
                      "shl16insli r16, r16, 16317\n"
                      "shl16insli r16, r16, -2081\n"
                      "{ fnop  ; dblalign4 r41, r10, r16  }\n"
                      "move %0, r41\n"
                      "move %1, r10\n"
                      "move %2, r16\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
