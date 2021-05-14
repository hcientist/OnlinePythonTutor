//file: _insn_test_bltzt_X1.c
//op=47
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

unsigned long mem[2] = { 0xfb39d803fce5e022, 0xa6f1d43f68e5d60e };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                     "movei r31, 0\n"
                     "bltzt r31,  %0\n"
                     "jal %1\n"
                     :: "i"(func_exit), "i"(func_call));
    return 0;
}
