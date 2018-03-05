//file: _insn_test_tblidxb1_Y0.c
//op=230
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

unsigned long mem[2] = { 0x5c5f60b8899f2703, 0x4826371b074e6849 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r10, 27846\n"
                      "shl16insli r10, r10, 314\n"
                      "shl16insli r10, r10, -26424\n"
                      "shl16insli r10, r10, 10908\n"
                      "moveli r2, -32180\n"
                      "shl16insli r2, r2, 27477\n"
                      "shl16insli r2, r2, 9680\n"
                      "shl16insli r2, r2, 16927\n"
                      "{ tblidxb1 r10, r2 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r10\n"
                      "move %1, r2\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
