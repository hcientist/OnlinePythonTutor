//file: _insn_test_nop_Y0.c
//op=179
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

unsigned long mem[2] = { 0x592fbed956a8fd1f, 0xb149341116c1d072 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "{ nop  ; fnop  ; ld r63, r54  }\n"
                      );
    return 0;
}
