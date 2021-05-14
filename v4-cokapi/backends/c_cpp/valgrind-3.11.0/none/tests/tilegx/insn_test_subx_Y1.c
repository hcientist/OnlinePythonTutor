//file: _insn_test_subx_Y1.c
//op=223
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

unsigned long mem[2] = { 0xb80daced7a10c38f, 0x7b03f62381712f55 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r11, -11286\n"
                      "shl16insli r11, r11, 24130\n"
                      "shl16insli r11, r11, -21471\n"
                      "shl16insli r11, r11, -29764\n"
                      "moveli r6, -5788\n"
                      "shl16insli r6, r6, -20401\n"
                      "shl16insli r6, r6, 13325\n"
                      "shl16insli r6, r6, -17582\n"
                      "moveli r31, 1590\n"
                      "shl16insli r31, r31, 2484\n"
                      "shl16insli r31, r31, 10483\n"
                      "shl16insli r31, r31, -30014\n"
                      "{ fnop  ; subx r11, r6, r31 ; ld r63, r54  }\n"
                      "move %0, r11\n"
                      "move %1, r6\n"
                      "move %2, r31\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
