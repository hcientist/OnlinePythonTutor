//file: _insn_test_v4int_l_X0.c
//op=324
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

unsigned long mem[2] = { 0x23b93f018ec49197, 0x228e8e83b7561e89 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r12, 7549\n"
                      "shl16insli r12, r12, -19041\n"
                      "shl16insli r12, r12, -30505\n"
                      "shl16insli r12, r12, -15011\n"
                      "moveli r7, 13064\n"
                      "shl16insli r7, r7, -5615\n"
                      "shl16insli r7, r7, -31470\n"
                      "shl16insli r7, r7, -17239\n"
                      "moveli r23, -24056\n"
                      "shl16insli r23, r23, -14095\n"
                      "shl16insli r23, r23, 1863\n"
                      "shl16insli r23, r23, -26485\n"
                      "{ v4int_l r12, r7, r23 ; fnop   }\n"
                      "move %0, r12\n"
                      "move %1, r7\n"
                      "move %2, r23\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
