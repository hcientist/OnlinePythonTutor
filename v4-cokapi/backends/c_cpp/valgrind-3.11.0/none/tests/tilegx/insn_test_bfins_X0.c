//file: _insn_test_bfins_X0.c
//op=35
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

unsigned long mem[2] = { 0x6873aadf3e763127, 0x74d4eb98b256c26b };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r49, 16197\n"
                      "shl16insli r49, r49, -9240\n"
                      "shl16insli r49, r49, -11331\n"
                      "shl16insli r49, r49, -8418\n"
                      "moveli r2, 17433\n"
                      "shl16insli r2, r2, 14709\n"
                      "shl16insli r2, r2, 26320\n"
                      "shl16insli r2, r2, -3232\n"
                      "{ bfins r49, r2, 21, 63 ; fnop   }\n"
                      "move %0, r49\n"
                      "move %1, r2\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
