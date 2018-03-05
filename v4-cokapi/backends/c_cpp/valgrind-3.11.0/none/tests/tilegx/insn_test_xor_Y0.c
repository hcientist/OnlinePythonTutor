//file: _insn_test_xor_Y0.c
//op=333
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

unsigned long mem[2] = { 0x4f4d9c00e64f18fd, 0x1894984f8a4b9b67 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r23, 15126\n"
                      "shl16insli r23, r23, -17631\n"
                      "shl16insli r23, r23, 31423\n"
                      "shl16insli r23, r23, 10557\n"
                      "moveli r20, -9320\n"
                      "shl16insli r20, r20, -29957\n"
                      "shl16insli r20, r20, 7281\n"
                      "shl16insli r20, r20, 3173\n"
                      "moveli r33, 2487\n"
                      "shl16insli r33, r33, 6184\n"
                      "shl16insli r33, r33, 10965\n"
                      "shl16insli r33, r33, -25198\n"
                      "{ xor r23, r20, r33 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r23\n"
                      "move %1, r20\n"
                      "move %2, r33\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
