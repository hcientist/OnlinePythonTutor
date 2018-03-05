//file: _insn_test_jr_Y1.c
//op=117
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

unsigned long mem[2] = { 0x5468060e74455729, 0x796b977f2174befa };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                     "jr %0\n"
                     :: "r"(func_exit));
    return 0;
}
