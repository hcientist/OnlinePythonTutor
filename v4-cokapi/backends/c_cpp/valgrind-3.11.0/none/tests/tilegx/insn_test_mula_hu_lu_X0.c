//file: _insn_test_mula_hu_lu_X0.c
//op=171
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

unsigned long mem[2] = { 0xe2c25e110bb59946, 0xd06357c8b3903323 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r36, -11276\n"
                      "shl16insli r36, r36, -71\n"
                      "shl16insli r36, r36, -26089\n"
                      "shl16insli r36, r36, 30233\n"
                      "moveli r22, 9301\n"
                      "shl16insli r22, r22, -32656\n"
                      "shl16insli r22, r22, -4555\n"
                      "shl16insli r22, r22, 17657\n"
                      "moveli r24, 17032\n"
                      "shl16insli r24, r24, 29889\n"
                      "shl16insli r24, r24, 32576\n"
                      "shl16insli r24, r24, 8242\n"
                      "{ mula_hu_lu r36, r22, r24 ; fnop   }\n"
                      "move %0, r36\n"
                      "move %1, r22\n"
                      "move %2, r24\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
