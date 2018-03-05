//file: _insn_test_cmpleu_Y0.c
//op=58
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

unsigned long mem[2] = { 0x9a968c4e2652e151, 0x6fd6d80e8b18c9bb };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r16, -12524\n"
                      "shl16insli r16, r16, -16020\n"
                      "shl16insli r16, r16, -28698\n"
                      "shl16insli r16, r16, -10230\n"
                      "moveli r20, -25048\n"
                      "shl16insli r20, r20, -26391\n"
                      "shl16insli r20, r20, -12179\n"
                      "shl16insli r20, r20, -11222\n"
                      "moveli r10, -656\n"
                      "shl16insli r10, r10, 236\n"
                      "shl16insli r10, r10, -4273\n"
                      "shl16insli r10, r10, -1226\n"
                      "{ cmpleu r16, r20, r10 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r16\n"
                      "move %1, r20\n"
                      "move %2, r10\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
