//file: _insn_test_fdouble_add_flags_X0.c
//op=82
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

unsigned long mem[2] = { 0x5ff5d41ce72b342e, 0xec57de1f0b8de6b3 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r40, -10411\n"
                      "shl16insli r40, r40, 28866\n"
                      "shl16insli r40, r40, 30647\n"
                      "shl16insli r40, r40, 15107\n"
                      "moveli r21, 13116\n"
                      "shl16insli r21, r21, 11172\n"
                      "shl16insli r21, r21, -2564\n"
                      "shl16insli r21, r21, 1912\n"
                      "moveli r44, 10847\n"
                      "shl16insli r44, r44, -21273\n"
                      "shl16insli r44, r44, -26560\n"
                      "shl16insli r44, r44, -2137\n"
                      "{ fdouble_add_flags r40, r21, r44 ; fnop   }\n"
                      "move %0, r40\n"
                      "move %1, r21\n"
                      "move %2, r44\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
