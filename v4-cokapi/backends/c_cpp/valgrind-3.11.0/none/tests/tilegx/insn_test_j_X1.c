//file: _insn_test_j_X1.c
//op=113
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

unsigned long mem[2] = { 0x721ddf3c2c82992f, 0xdc2f92eb642eb1d1 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                     "j %0\n"
                     :: "i"(func_exit));
    return 0;
}
