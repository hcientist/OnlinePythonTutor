//file: _insn_test_dblalign_X0.c
//op=74
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

unsigned long mem[2] = { 0x68fb6e92c7467995, 0x712fa2e35cfc84ba };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r14, -10628\n"
                      "shl16insli r14, r14, 21331\n"
                      "shl16insli r14, r14, -19208\n"
                      "shl16insli r14, r14, 14673\n"
                      "moveli r28, -30755\n"
                      "shl16insli r28, r28, 5835\n"
                      "shl16insli r28, r28, -24471\n"
                      "shl16insli r28, r28, -4179\n"
                      "moveli r29, -10637\n"
                      "shl16insli r29, r29, -13587\n"
                      "shl16insli r29, r29, 6072\n"
                      "shl16insli r29, r29, -2381\n"
                      "{ dblalign r14, r28, r29 ; fnop   }\n"
                      "move %0, r14\n"
                      "move %1, r28\n"
                      "move %2, r29\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
