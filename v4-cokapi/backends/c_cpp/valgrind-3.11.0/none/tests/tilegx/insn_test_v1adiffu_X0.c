//file: _insn_test_v1adiffu_X0.c
//op=236
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

unsigned long mem[2] = { 0x4b94365a94fc8379, 0xd398d9dcfc90866b };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r2, 21980\n"
                      "shl16insli r2, r2, 6619\n"
                      "shl16insli r2, r2, -5633\n"
                      "shl16insli r2, r2, 14172\n"
                      "moveli r35, 208\n"
                      "shl16insli r35, r35, 20913\n"
                      "shl16insli r35, r35, 19131\n"
                      "shl16insli r35, r35, -17081\n"
                      "moveli r33, 25300\n"
                      "shl16insli r33, r33, 18828\n"
                      "shl16insli r33, r33, 835\n"
                      "shl16insli r33, r33, 10241\n"
                      "{ v1adiffu r2, r35, r33 ; fnop   }\n"
                      "move %0, r2\n"
                      "move %1, r35\n"
                      "move %2, r33\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
