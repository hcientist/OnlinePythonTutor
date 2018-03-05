//file: _insn_test_jal_X1.c
//op=114
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

unsigned long mem[2] = { 0x97c50c1862f77907, 0xd4017cfe9fa6ebaa };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                     "jal %0\n"
                     :: "i"(func_call));
    return 0;
}
