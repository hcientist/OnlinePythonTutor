//file: _insn_test_addi_Y0.c
//op=23
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

unsigned long mem[2] = { 0xc50a9ede838fadbb, 0xc2d6db3411b6362 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r10, -29553\n"
                      "shl16insli r10, r10, 1035\n"
                      "shl16insli r10, r10, 5152\n"
                      "shl16insli r10, r10, -10394\n"
                      "moveli r3, 16496\n"
                      "shl16insli r3, r3, 1901\n"
                      "shl16insli r3, r3, -17744\n"
                      "shl16insli r3, r3, 5578\n"
                      "{ addi r10, r3, 13 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r10\n"
                      "move %1, r3\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
