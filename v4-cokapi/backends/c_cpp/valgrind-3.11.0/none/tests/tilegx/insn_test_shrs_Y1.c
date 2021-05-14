//file: _insn_test_shrs_Y1.c
//op=199
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

unsigned long mem[2] = { 0x744ac897b12768c8, 0x643ae14995d28745 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r32, -3067\n"
                      "shl16insli r32, r32, -406\n"
                      "shl16insli r32, r32, 4305\n"
                      "shl16insli r32, r32, -13947\n"
                      "moveli r26, -23554\n"
                      "shl16insli r26, r26, 503\n"
                      "shl16insli r26, r26, -18013\n"
                      "shl16insli r26, r26, 27535\n"
                      "moveli r26, -13851\n"
                      "shl16insli r26, r26, 4596\n"
                      "shl16insli r26, r26, -18309\n"
                      "shl16insli r26, r26, -24130\n"
                      "{ fnop  ; shrs r32, r26, r26 ; ld r63, r54  }\n"
                      "move %0, r32\n"
                      "move %1, r26\n"
                      "move %2, r26\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
