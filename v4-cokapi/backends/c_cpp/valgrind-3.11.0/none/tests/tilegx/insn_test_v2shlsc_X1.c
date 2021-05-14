//file: _insn_test_v2shlsc_X1.c
//op=314
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

unsigned long mem[2] = { 0x75c151f71f3dac9d, 0xc2cac20f9054ab64 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r42, -14850\n"
                      "shl16insli r42, r42, -32360\n"
                      "shl16insli r42, r42, 12889\n"
                      "shl16insli r42, r42, 3288\n"
                      "moveli r27, -3965\n"
                      "shl16insli r27, r27, -6372\n"
                      "shl16insli r27, r27, 21671\n"
                      "shl16insli r27, r27, 553\n"
                      "moveli r24, -19347\n"
                      "shl16insli r24, r24, 16492\n"
                      "shl16insli r24, r24, 10067\n"
                      "shl16insli r24, r24, 7567\n"
                      "{ fnop  ; v2shlsc r42, r27, r24  }\n"
                      "move %0, r42\n"
                      "move %1, r27\n"
                      "move %2, r24\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
