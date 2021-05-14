//file: _insn_test_shl3addx_X0.c
//op=195
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

unsigned long mem[2] = { 0x5d526fffff5940db, 0x85ff61d332ccdd58 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r2, 6570\n"
                      "shl16insli r2, r2, -30096\n"
                      "shl16insli r2, r2, -3418\n"
                      "shl16insli r2, r2, 9405\n"
                      "moveli r11, -1170\n"
                      "shl16insli r11, r11, -1505\n"
                      "shl16insli r11, r11, -1810\n"
                      "shl16insli r11, r11, 12649\n"
                      "moveli r17, -7548\n"
                      "shl16insli r17, r17, -12942\n"
                      "shl16insli r17, r17, -2876\n"
                      "shl16insli r17, r17, 29349\n"
                      "{ shl3addx r2, r11, r17 ; fnop   }\n"
                      "move %0, r2\n"
                      "move %1, r11\n"
                      "move %2, r17\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
