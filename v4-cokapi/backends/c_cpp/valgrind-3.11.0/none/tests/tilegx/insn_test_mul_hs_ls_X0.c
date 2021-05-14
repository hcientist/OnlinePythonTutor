//file: _insn_test_mul_hs_ls_X0.c
//op=157
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

unsigned long mem[2] = { 0xc2cac20f9054ab64, 0xc57bfb2ed874d267 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r22, 30145\n"
                      "shl16insli r22, r22, 20983\n"
                      "shl16insli r22, r22, 7997\n"
                      "shl16insli r22, r22, -21347\n"
                      "moveli r0, 3083\n"
                      "shl16insli r0, r0, -6125\n"
                      "shl16insli r0, r0, -10642\n"
                      "shl16insli r0, r0, 872\n"
                      "moveli r19, -14850\n"
                      "shl16insli r19, r19, -32360\n"
                      "shl16insli r19, r19, 12889\n"
                      "shl16insli r19, r19, 3288\n"
                      "{ mul_hs_ls r22, r0, r19 ; fnop   }\n"
                      "move %0, r22\n"
                      "move %1, r0\n"
                      "move %2, r19\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
