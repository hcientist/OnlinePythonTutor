//file: _insn_test_v2shl_X0.c
//op=312
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

unsigned long mem[2] = { 0x11c672ab78dd743b, 0x31d131ae6b7da416 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r34, 29514\n"
                      "shl16insli r34, r34, 14828\n"
                      "shl16insli r34, r34, 1013\n"
                      "shl16insli r34, r34, 14302\n"
                      "moveli r19, -22322\n"
                      "shl16insli r19, r19, -9600\n"
                      "shl16insli r19, r19, 31146\n"
                      "shl16insli r19, r19, -10762\n"
                      "moveli r19, 1482\n"
                      "shl16insli r19, r19, 23578\n"
                      "shl16insli r19, r19, 5382\n"
                      "shl16insli r19, r19, 26331\n"
                      "{ v2shl r34, r19, r19 ; fnop   }\n"
                      "move %0, r34\n"
                      "move %1, r19\n"
                      "move %2, r19\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
