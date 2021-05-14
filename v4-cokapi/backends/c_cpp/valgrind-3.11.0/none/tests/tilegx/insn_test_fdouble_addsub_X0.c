//file: _insn_test_fdouble_addsub_X0.c
//op=83
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

unsigned long mem[2] = { 0x57b488292bdd9c2b, 0xfd7e2c78d6f58fbd };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r50, 9884\n"
                      "shl16insli r50, r50, -18142\n"
                      "shl16insli r50, r50, -24129\n"
                      "shl16insli r50, r50, 11296\n"
                      "moveli r9, -26512\n"
                      "shl16insli r9, r9, -8064\n"
                      "shl16insli r9, r9, 9043\n"
                      "shl16insli r9, r9, 18472\n"
                      "moveli r20, 4246\n"
                      "shl16insli r20, r20, 6079\n"
                      "shl16insli r20, r20, 8698\n"
                      "shl16insli r20, r20, -2697\n"
                      "{ fdouble_addsub r50, r9, r20 ; fnop   }\n"
                      "move %0, r50\n"
                      "move %1, r9\n"
                      "move %2, r20\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
