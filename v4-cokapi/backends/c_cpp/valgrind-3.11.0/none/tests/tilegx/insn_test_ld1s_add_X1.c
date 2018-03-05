//file: _insn_test_ld1s_add_X1.c
//op=121
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

unsigned long mem[2] = { 0xbf944e471ed68a09, 0xc750773165e75c2a };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r11, 2389\n"
                      "shl16insli r11, r11, -8821\n"
                      "shl16insli r11, r11, -19715\n"
                      "shl16insli r11, r11, 21029\n"
                      "moveli r19, 8794\n"
                      "shl16insli r19, r19, -28834\n"
                      "shl16insli r19, r19, 6092\n"
                      "shl16insli r19, r19, 15960\n"
                      "move r19, %2\n"
                      "{ fnop  ; ld1s_add r11, r19, -82  }\n"
                      "move %0, r11\n"
                      "move %1, r19\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
