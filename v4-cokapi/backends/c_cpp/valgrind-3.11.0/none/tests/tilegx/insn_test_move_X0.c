//file: _insn_test_move_X0.c
//op=5
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

unsigned long mem[2] = { 0xbccc64192e474b2d, 0xae4a1eebcf0aa6f1 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r22, -6666\n"
                      "shl16insli r22, r22, 9055\n"
                      "shl16insli r22, r22, 10215\n"
                      "shl16insli r22, r22, -15289\n"
                      "moveli r35, -17246\n"
                      "shl16insli r35, r35, 164\n"
                      "shl16insli r35, r35, 31728\n"
                      "shl16insli r35, r35, -28689\n"
                      "{ move r22, r35 ; fnop   }\n"
                      "move %0, r22\n"
                      "move %1, r35\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
