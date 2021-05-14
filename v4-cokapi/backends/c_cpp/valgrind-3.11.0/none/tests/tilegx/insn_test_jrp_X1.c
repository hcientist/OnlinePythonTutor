//file: _insn_test_jrp_X1.c
//op=118
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

unsigned long mem[2] = { 0xd398d9dcfc90866b, 0xdfe94ab09fee22a5 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                     "jrp %0\n"
                     :: "r"(func_exit));
    return 0;
}
