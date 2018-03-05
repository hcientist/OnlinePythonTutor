//file: _insn_test_v1ddotpu_X0.c
//op=247
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

unsigned long mem[2] = { 0xc5185c9ad40a6c8e, 0x38d738cd6b643ded };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r38, -30305\n"
                      "shl16insli r38, r38, -15724\n"
                      "shl16insli r38, r38, 16680\n"
                      "shl16insli r38, r38, -25985\n"
                      "moveli r11, -14413\n"
                      "shl16insli r11, r11, -6278\n"
                      "shl16insli r11, r11, -14697\n"
                      "shl16insli r11, r11, -23431\n"
                      "moveli r4, 122\n"
                      "shl16insli r4, r4, 8399\n"
                      "shl16insli r4, r4, -22661\n"
                      "shl16insli r4, r4, -9174\n"
                      "{ v1ddotpu r38, r11, r4 ; fnop   }\n"
                      "move %0, r38\n"
                      "move %1, r11\n"
                      "move %2, r4\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
