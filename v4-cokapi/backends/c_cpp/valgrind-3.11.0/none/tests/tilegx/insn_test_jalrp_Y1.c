//file: _insn_test_jalrp_Y1.c
//op=116
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

unsigned long mem[2] = { 0xcf14c16c8fe6d80a, 0x9a968c4e2652e151 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                     "jalrp %0\n"
                     :: "r"(func_call));
    return 0;
}
