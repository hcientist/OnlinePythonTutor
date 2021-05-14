//file: _insn_test_v1mnz_X0.c
//op=263
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

unsigned long mem[2] = { 0x3713ce4eed37fdb1, 0xb8fb1c28cc3fba32 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r37, -32459\n"
                      "shl16insli r37, r37, 16523\n"
                      "shl16insli r37, r37, 2092\n"
                      "shl16insli r37, r37, -8699\n"
                      "moveli r5, 8954\n"
                      "shl16insli r5, r5, 9384\n"
                      "shl16insli r5, r5, 3635\n"
                      "shl16insli r5, r5, -28024\n"
                      "moveli r22, 7513\n"
                      "shl16insli r22, r22, -1317\n"
                      "shl16insli r22, r22, 32450\n"
                      "shl16insli r22, r22, -11880\n"
                      "{ v1mnz r37, r5, r22 ; fnop   }\n"
                      "move %0, r37\n"
                      "move %1, r5\n"
                      "move %2, r22\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
