//file: _insn_test_mulx_X0.c
//op=176
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

unsigned long mem[2] = { 0xe468b0628a4b2c82, 0xab961c7cdfcb76d0 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r34, -17450\n"
                      "shl16insli r34, r34, 24652\n"
                      "shl16insli r34, r34, 22143\n"
                      "shl16insli r34, r34, -2590\n"
                      "moveli r20, 3184\n"
                      "shl16insli r20, r20, 7750\n"
                      "shl16insli r20, r20, -24327\n"
                      "shl16insli r20, r20, 22846\n"
                      "moveli r43, -31998\n"
                      "shl16insli r43, r43, 23863\n"
                      "shl16insli r43, r43, -12992\n"
                      "shl16insli r43, r43, -15691\n"
                      "{ mulx r34, r20, r43 ; fnop   }\n"
                      "move %0, r34\n"
                      "move %1, r20\n"
                      "move %2, r43\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
