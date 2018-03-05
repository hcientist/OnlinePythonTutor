//file: _insn_test_v2shrui_X1.c
//op=318
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

unsigned long mem[2] = { 0xd373e4dd4abdb244, 0x2f10bc93a323ca0d };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r23, 20609\n"
                      "shl16insli r23, r23, -28665\n"
                      "shl16insli r23, r23, -5637\n"
                      "shl16insli r23, r23, -7979\n"
                      "moveli r22, -6693\n"
                      "shl16insli r22, r22, 32122\n"
                      "shl16insli r22, r22, 32283\n"
                      "shl16insli r22, r22, -22128\n"
                      "{ fnop  ; v2shrui r23, r22, 62  }\n"
                      "move %0, r23\n"
                      "move %1, r22\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
