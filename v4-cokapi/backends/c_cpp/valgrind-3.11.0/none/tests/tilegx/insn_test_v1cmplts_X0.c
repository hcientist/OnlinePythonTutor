//file: _insn_test_v1cmplts_X0.c
//op=242
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

unsigned long mem[2] = { 0x955dd8bb2fd5225, 0xbf944e471ed68a09 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r24, -6390\n"
                      "shl16insli r24, r24, 7138\n"
                      "shl16insli r24, r24, -13688\n"
                      "shl16insli r24, r24, 18787\n"
                      "moveli r40, 19035\n"
                      "shl16insli r40, r40, -3036\n"
                      "shl16insli r40, r40, -31964\n"
                      "shl16insli r40, r40, -9865\n"
                      "moveli r0, -31939\n"
                      "shl16insli r0, r0, 30972\n"
                      "shl16insli r0, r0, 13500\n"
                      "shl16insli r0, r0, 23688\n"
                      "{ v1cmplts r24, r40, r0 ; fnop   }\n"
                      "move %0, r24\n"
                      "move %1, r40\n"
                      "move %2, r0\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
