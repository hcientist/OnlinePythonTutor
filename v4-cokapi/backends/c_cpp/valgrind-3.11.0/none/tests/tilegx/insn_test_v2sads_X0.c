//file: _insn_test_v2sads_X0.c
//op=310
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

unsigned long mem[2] = { 0xb4cc28ab90e8a37, 0xc707c0e7f8704eba };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r22, 14299\n"
                      "shl16insli r22, r22, -16601\n"
                      "shl16insli r22, r22, -30080\n"
                      "shl16insli r22, r22, 10179\n"
                      "moveli r10, -32760\n"
                      "shl16insli r10, r10, 21279\n"
                      "shl16insli r10, r10, 9681\n"
                      "shl16insli r10, r10, 15414\n"
                      "moveli r21, 29123\n"
                      "shl16insli r21, r21, -20065\n"
                      "shl16insli r21, r21, 10672\n"
                      "shl16insli r21, r21, -17765\n"
                      "{ v2sads r22, r10, r21 ; fnop   }\n"
                      "move %0, r22\n"
                      "move %1, r10\n"
                      "move %2, r21\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
