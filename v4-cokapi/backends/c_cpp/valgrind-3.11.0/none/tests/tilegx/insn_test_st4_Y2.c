//file: _insn_test_st4_Y2.c
//op=211
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

unsigned long mem[2] = { 0x559c13b7886a9188, 0xe3421eb8576951b8 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r29, -22718\n"
                      "shl16insli r29, r29, 15821\n"
                      "shl16insli r29, r29, -14581\n"
                      "shl16insli r29, r29, -14875\n"
                      "moveli r38, -13950\n"
                      "shl16insli r38, r38, 11169\n"
                      "shl16insli r38, r38, -18391\n"
                      "shl16insli r38, r38, -19133\n"
                      "move r29, %2\n"
                      "{ fnop  ; fnop  ; st4 r29, r38  }\n"
                      "move %0, r29\n"
                      "move %1, r38\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
