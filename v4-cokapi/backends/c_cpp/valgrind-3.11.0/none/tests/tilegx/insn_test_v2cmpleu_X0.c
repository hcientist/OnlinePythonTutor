//file: _insn_test_v2cmpleu_X0.c
//op=286
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

unsigned long mem[2] = { 0x3ef8a65156ec00ac, 0x59fad680489ec628 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r50, 27539\n"
                      "shl16insli r50, r50, -29737\n"
                      "shl16insli r50, r50, 27831\n"
                      "shl16insli r50, r50, -25163\n"
                      "moveli r13, 694\n"
                      "shl16insli r13, r13, -3893\n"
                      "shl16insli r13, r13, 5047\n"
                      "shl16insli r13, r13, -7475\n"
                      "moveli r2, -31766\n"
                      "shl16insli r2, r2, 20217\n"
                      "shl16insli r2, r2, -13682\n"
                      "shl16insli r2, r2, -10053\n"
                      "{ v2cmpleu r50, r13, r2 ; fnop   }\n"
                      "move %0, r50\n"
                      "move %1, r13\n"
                      "move %2, r2\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
