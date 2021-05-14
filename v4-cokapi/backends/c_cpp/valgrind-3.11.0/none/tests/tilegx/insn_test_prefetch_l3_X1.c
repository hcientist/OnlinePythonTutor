//file: _insn_test_prefetch_l3_X1.c
//op=19
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

unsigned long mem[2] = { 0xb026dbf41e76db36, 0x3030888d84db4c82 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r13, 8736\n"
                      "shl16insli r13, r13, -19069\n"
                      "shl16insli r13, r13, -2177\n"
                      "shl16insli r13, r13, 29968\n"
                      "{ fnop  ; prefetch_l3 r13  }\n"
                      "move %0, r13\n"
                      :"=r"(a[0]));
    printf("%016lx\n", a[0]);
    return 0;
}
