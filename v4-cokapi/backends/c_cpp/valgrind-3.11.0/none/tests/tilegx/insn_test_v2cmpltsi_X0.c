//file: _insn_test_v2cmpltsi_X0.c
//op=288
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

unsigned long mem[2] = { 0x659ad846d801a198, 0xfa50dcf0b044d59a };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r1, 7596\n"
                      "shl16insli r1, r1, -10648\n"
                      "shl16insli r1, r1, 15573\n"
                      "shl16insli r1, r1, -25790\n"
                      "moveli r40, -27339\n"
                      "shl16insli r40, r40, -13420\n"
                      "shl16insli r40, r40, 19273\n"
                      "shl16insli r40, r40, -27678\n"
                      "{ v2cmpltsi r1, r40, 43 ; fnop   }\n"
                      "move %0, r1\n"
                      "move %1, r40\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
