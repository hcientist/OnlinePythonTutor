//file: _insn_test_wh64_X1.c
//op=332
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

unsigned long mem[2] = { 0x109617bf21faf577, 0x269cb922a1bf2c20 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r11, -29126\n"
                      "shl16insli r11, r11, -20326\n"
                      "shl16insli r11, r11, 27689\n"
                      "shl16insli r11, r11, 15548\n"
                      "{ fnop  ; wh64 r11  }\n"
                      "move %0, r11\n"
                      :"=r"(a[0]));
    printf("%016lx\n", a[0]);
    return 0;
}
