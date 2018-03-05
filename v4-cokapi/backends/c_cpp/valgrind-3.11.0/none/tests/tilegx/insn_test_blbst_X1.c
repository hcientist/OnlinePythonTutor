//file: _insn_test_blbst_X1.c
//op=43
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

unsigned long mem[2] = { 0xc2c31988eb4ca702, 0x400324c1f2522cf8 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                     "movei r33, 0\n"
                     "blbst r33,  %0\n"
                     "jal %1\n"
                     :: "i"(func_exit), "i"(func_call));
    return 0;
}
