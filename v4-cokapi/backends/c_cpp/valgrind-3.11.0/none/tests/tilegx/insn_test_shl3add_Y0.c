//file: _insn_test_shl3add_Y0.c
//op=194
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

unsigned long mem[2] = { 0xc8704900d8de98e2, 0xdeb2133cfb2c5342 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r9, 9269\n"
                      "shl16insli r9, r9, 23416\n"
                      "shl16insli r9, r9, -14988\n"
                      "shl16insli r9, r9, 22168\n"
                      "moveli r44, -12324\n"
                      "shl16insli r44, r44, -28627\n"
                      "shl16insli r44, r44, 16604\n"
                      "shl16insli r44, r44, -17536\n"
                      "moveli r1, 7448\n"
                      "shl16insli r1, r1, 10894\n"
                      "shl16insli r1, r1, 29909\n"
                      "shl16insli r1, r1, 28991\n"
                      "{ shl3add r9, r44, r1 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r9\n"
                      "move %1, r44\n"
                      "move %2, r1\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
