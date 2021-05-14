//file: _insn_test_flushwb_X1.c
//op=100
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

unsigned long mem[2] = { 0xd85a80d7b6245b44, 0x4035b9e3ec473fc4 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "{ fnop  ; flushwb   }\n"
                      );
    return 0;
}
