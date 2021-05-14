//file: _insn_test_blez_X1.c
//op=44
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

unsigned long mem[2] = { 0xa9ccfec4f599744d, 0xcbf6dda12670067 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                     "movei r28, 0\n"
                     "blez r28,  %0\n"
                     "jal %1\n"
                     :: "i"(func_exit), "i"(func_call));
    return 0;
}
