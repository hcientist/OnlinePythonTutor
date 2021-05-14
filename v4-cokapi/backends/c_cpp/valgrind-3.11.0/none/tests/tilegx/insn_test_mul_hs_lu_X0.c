//file: _insn_test_mul_hs_lu_X0.c
//op=158
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

unsigned long mem[2] = { 0x194c873261582759, 0x910a2955c6e71b1 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r6, 31890\n"
                      "shl16insli r6, r6, 22503\n"
                      "shl16insli r6, r6, 26461\n"
                      "shl16insli r6, r6, -16338\n"
                      "moveli r25, 31333\n"
                      "shl16insli r25, r25, 15554\n"
                      "shl16insli r25, r25, 16035\n"
                      "shl16insli r25, r25, -6284\n"
                      "moveli r17, -19874\n"
                      "shl16insli r17, r17, -32652\n"
                      "shl16insli r17, r17, -27551\n"
                      "shl16insli r17, r17, 14010\n"
                      "{ mul_hs_lu r6, r25, r17 ; fnop   }\n"
                      "move %0, r6\n"
                      "move %1, r25\n"
                      "move %2, r17\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
