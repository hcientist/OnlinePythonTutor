//file: _insn_test_v4packsc_X1.c
//op=325
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

unsigned long mem[2] = { 0x9662ab02d3651bd3, 0x7d173ebe8d71845 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r11, 8404\n"
                      "shl16insli r11, r11, -13138\n"
                      "shl16insli r11, r11, -8174\n"
                      "shl16insli r11, r11, 18247\n"
                      "moveli r42, 26140\n"
                      "shl16insli r42, r42, 28081\n"
                      "shl16insli r42, r42, -4734\n"
                      "shl16insli r42, r42, -2567\n"
                      "moveli r34, 1665\n"
                      "shl16insli r34, r34, -24287\n"
                      "shl16insli r34, r34, 25276\n"
                      "shl16insli r34, r34, 26188\n"
                      "{ fnop  ; v4packsc r11, r42, r34  }\n"
                      "move %0, r11\n"
                      "move %1, r42\n"
                      "move %2, r34\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
