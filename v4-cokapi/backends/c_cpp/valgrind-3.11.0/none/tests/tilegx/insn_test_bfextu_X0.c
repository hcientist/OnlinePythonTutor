//file: _insn_test_bfextu_X0.c
//op=34
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

unsigned long mem[2] = { 0x7eda32ada2f5060, 0xbcd5fb19de288be };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r15, -32243\n"
                      "shl16insli r15, r15, 5581\n"
                      "shl16insli r15, r15, 25121\n"
                      "shl16insli r15, r15, 18660\n"
                      "moveli r32, -2571\n"
                      "shl16insli r32, r32, 10073\n"
                      "shl16insli r32, r32, -8744\n"
                      "shl16insli r32, r32, 32440\n"
                      "{ bfextu r15, r32, 13, 52 ; fnop   }\n"
                      "move %0, r15\n"
                      "move %1, r32\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
