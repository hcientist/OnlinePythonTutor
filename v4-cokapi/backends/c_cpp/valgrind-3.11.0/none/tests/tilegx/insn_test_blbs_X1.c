//file: _insn_test_blbs_X1.c
//op=42
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

unsigned long mem[2] = { 0xce5c4dd59315697c, 0x420f71d29a23b3eb };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                     "movei r42, 1\n"
                     "blbs r42,  %0\n"
                     "jal %1\n"
                     :: "i"(func_exit), "i"(func_call));
    return 0;
}
