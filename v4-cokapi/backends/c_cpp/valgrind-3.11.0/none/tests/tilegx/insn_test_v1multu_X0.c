//file: _insn_test_v1multu_X0.c
//op=264
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

unsigned long mem[2] = { 0x68357d0341698c99, 0x3076e248a1b03309 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r41, 3184\n"
                      "shl16insli r41, r41, 7750\n"
                      "shl16insli r41, r41, -24327\n"
                      "shl16insli r41, r41, 22846\n"
                      "moveli r20, -22618\n"
                      "shl16insli r20, r20, 24630\n"
                      "shl16insli r20, r20, -15349\n"
                      "shl16insli r20, r20, 29173\n"
                      "moveli r44, 21939\n"
                      "shl16insli r44, r44, 20800\n"
                      "shl16insli r44, r44, 15363\n"
                      "shl16insli r44, r44, -32405\n"
                      "{ v1multu r41, r20, r44 ; fnop   }\n"
                      "move %0, r41\n"
                      "move %1, r20\n"
                      "move %2, r44\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
