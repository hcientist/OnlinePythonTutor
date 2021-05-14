//file: _insn_test_mula_hu_ls_X0.c
//op=170
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

unsigned long mem[2] = { 0x7c2b00bc8a60c95d, 0x8a6bdf08a51f10d3 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r22, -8315\n"
                      "shl16insli r22, r22, 5404\n"
                      "shl16insli r22, r22, 15177\n"
                      "shl16insli r22, r22, -6931\n"
                      "moveli r12, -20178\n"
                      "shl16insli r12, r12, 16109\n"
                      "shl16insli r12, r12, -17955\n"
                      "shl16insli r12, r12, 766\n"
                      "moveli r43, -29874\n"
                      "shl16insli r43, r43, -7795\n"
                      "shl16insli r43, r43, -2712\n"
                      "shl16insli r43, r43, 26506\n"
                      "{ mula_hu_ls r22, r12, r43 ; fnop   }\n"
                      "move %0, r22\n"
                      "move %1, r12\n"
                      "move %2, r43\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
