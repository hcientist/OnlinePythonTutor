//file: _insn_test_v2addsc_X0.c
//op=280
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

unsigned long mem[2] = { 0x65cf6bab5dfbf927, 0x455f86368ee6a1bf };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r7, 9473\n"
                      "shl16insli r7, r7, -14156\n"
                      "shl16insli r7, r7, 12314\n"
                      "shl16insli r7, r7, -12172\n"
                      "moveli r22, 28628\n"
                      "shl16insli r22, r22, -15724\n"
                      "shl16insli r22, r22, 22937\n"
                      "shl16insli r22, r22, -21350\n"
                      "moveli r23, -4550\n"
                      "shl16insli r23, r23, 10548\n"
                      "shl16insli r23, r23, -3563\n"
                      "shl16insli r23, r23, -26830\n"
                      "{ v2addsc r7, r22, r23 ; fnop   }\n"
                      "move %0, r7\n"
                      "move %1, r22\n"
                      "move %2, r23\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
