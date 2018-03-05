//file: _insn_test_v1ddotpusa_X0.c
//op=250
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

unsigned long mem[2] = { 0x3ae24f779a8d3dc, 0x6bfa391c07b5ae93 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r29, 11405\n"
                      "shl16insli r29, r29, 16621\n"
                      "shl16insli r29, r29, -29926\n"
                      "shl16insli r29, r29, -21425\n"
                      "moveli r22, 29339\n"
                      "shl16insli r22, r22, -30280\n"
                      "shl16insli r22, r22, 6890\n"
                      "shl16insli r22, r22, 27358\n"
                      "moveli r1, 30556\n"
                      "shl16insli r1, r1, -25484\n"
                      "shl16insli r1, r1, 28103\n"
                      "shl16insli r1, r1, 12543\n"
                      "{ v1ddotpusa r29, r22, r1 ; fnop   }\n"
                      "move %0, r29\n"
                      "move %1, r22\n"
                      "move %2, r1\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
