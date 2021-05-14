//file: _insn_test_blezt_X1.c
//op=45
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

unsigned long mem[2] = { 0x22577cfa5789437f, 0x480f8d654b2eb8b3 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                     "movei r45, 1\n"
                     "blezt r45,  %0\n"
                     "jal %1\n"
                     :: "i"(func_exit), "i"(func_call));
    return 0;
}
