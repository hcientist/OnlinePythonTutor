//file: _insn_test_v1maxu_X1.c
//op=259
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

unsigned long mem[2] = { 0x5555b89e33103d34, 0x72ce0e1d1ecdfc7b };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r7, 31643\n"
                      "shl16insli r7, r7, -418\n"
                      "shl16insli r7, r7, -25830\n"
                      "shl16insli r7, r7, 267\n"
                      "moveli r17, 21415\n"
                      "shl16insli r17, r17, 28561\n"
                      "shl16insli r17, r17, 26253\n"
                      "shl16insli r17, r17, -24335\n"
                      "moveli r5, -8528\n"
                      "shl16insli r5, r5, 8536\n"
                      "shl16insli r5, r5, -30783\n"
                      "shl16insli r5, r5, 721\n"
                      "{ fnop  ; v1maxu r7, r17, r5  }\n"
                      "move %0, r7\n"
                      "move %1, r17\n"
                      "move %2, r5\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
