//file: _insn_test_mula_hs_hu_X0.c
//op=166
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

unsigned long mem[2] = { 0x269cb922a1bf2c20, 0x57b488292bdd9c2b };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r30, 4246\n"
                      "shl16insli r30, r30, 6079\n"
                      "shl16insli r30, r30, 8698\n"
                      "shl16insli r30, r30, -2697\n"
                      "moveli r29, 27899\n"
                      "shl16insli r29, r29, -1363\n"
                      "shl16insli r29, r29, 695\n"
                      "shl16insli r29, r29, -3150\n"
                      "moveli r29, -29126\n"
                      "shl16insli r29, r29, -20326\n"
                      "shl16insli r29, r29, 27689\n"
                      "shl16insli r29, r29, 15548\n"
                      "{ mula_hs_hu r30, r29, r29 ; fnop   }\n"
                      "move %0, r30\n"
                      "move %1, r29\n"
                      "move %2, r29\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
