//file: _insn_test_v1sub_X1.c
//op=276
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

unsigned long mem[2] = { 0x1fe54969a93a157a, 0x778f2f6f17d9003b };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r44, 21888\n"
                      "shl16insli r44, r44, -8663\n"
                      "shl16insli r44, r44, -14905\n"
                      "shl16insli r44, r44, -14362\n"
                      "moveli r26, -18766\n"
                      "shl16insli r26, r26, 19438\n"
                      "shl16insli r26, r26, 15394\n"
                      "shl16insli r26, r26, -6172\n"
                      "moveli r24, 28503\n"
                      "shl16insli r24, r24, 24946\n"
                      "shl16insli r24, r24, 28527\n"
                      "shl16insli r24, r24, 6539\n"
                      "{ fnop  ; v1sub r44, r26, r24  }\n"
                      "move %0, r44\n"
                      "move %1, r26\n"
                      "move %2, r24\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
