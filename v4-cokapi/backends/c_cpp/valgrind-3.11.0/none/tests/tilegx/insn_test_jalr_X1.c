//file: _insn_test_jalr_X1.c
//op=115
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

unsigned long mem[2] = { 0x4826371b074e6849, 0xf512a65b934c3280 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                     "jalr %0\n"
                     :: "r"(func_call));
    return 0;
}
