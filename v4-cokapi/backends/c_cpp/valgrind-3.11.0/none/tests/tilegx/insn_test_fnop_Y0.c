//file: _insn_test_fnop_Y0.c
//op=101
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

unsigned long mem[2] = { 0x1b58c82cfa9e7805, 0xeb546e8d18f5ab4c };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "{ fnop  ; fnop  ; ld r63, r54  }\n"
                      );
    return 0;
}
