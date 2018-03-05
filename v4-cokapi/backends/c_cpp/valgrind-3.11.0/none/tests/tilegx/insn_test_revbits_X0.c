//file: _insn_test_revbits_X0.c
//op=184
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

unsigned long mem[2] = { 0x683c0bdf5b51687b, 0x82d752d6d5c34590 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r43, -27981\n"
                      "shl16insli r43, r43, -3839\n"
                      "shl16insli r43, r43, -10726\n"
                      "shl16insli r43, r43, 16403\n"
                      "moveli r48, 21888\n"
                      "shl16insli r48, r48, -8663\n"
                      "shl16insli r48, r48, -14905\n"
                      "shl16insli r48, r48, -14362\n"
                      "{ revbits r43, r48 ; fnop   }\n"
                      "move %0, r43\n"
                      "move %1, r48\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
