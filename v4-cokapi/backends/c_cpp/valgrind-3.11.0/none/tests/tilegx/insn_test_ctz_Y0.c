//file: _insn_test_ctz_Y0.c
//op=73
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

unsigned long mem[2] = { 0xea70c8b3ffd336c3, 0x4dcbb13e69f7210c };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r20, 21188\n"
                      "shl16insli r20, r20, -26615\n"
                      "shl16insli r20, r20, -6842\n"
                      "shl16insli r20, r20, 23302\n"
                      "moveli r15, -28043\n"
                      "shl16insli r15, r15, -17799\n"
                      "shl16insli r15, r15, -27340\n"
                      "shl16insli r15, r15, -22535\n"
                      "{ ctz r20, r15 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r20\n"
                      "move %1, r15\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
