//file: _insn_test_mula_hs_hs_X0.c
//op=165
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

unsigned long mem[2] = { 0xec7e102d827fb085, 0x2fbb511bf652c89f };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r42, -23610\n"
                      "shl16insli r42, r42, -23703\n"
                      "shl16insli r42, r42, 2719\n"
                      "shl16insli r42, r42, -32635\n"
                      "moveli r11, 21737\n"
                      "shl16insli r11, r11, 21508\n"
                      "shl16insli r11, r11, 4642\n"
                      "shl16insli r11, r11, -1298\n"
                      "moveli r45, 16489\n"
                      "shl16insli r45, r45, 1852\n"
                      "shl16insli r45, r45, -22328\n"
                      "shl16insli r45, r45, -20016\n"
                      "{ mula_hs_hs r42, r11, r45 ; fnop   }\n"
                      "move %0, r42\n"
                      "move %1, r11\n"
                      "move %2, r45\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
