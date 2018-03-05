//file: _insn_test_mula_hs_lu_X0.c
//op=168
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

unsigned long mem[2] = { 0xf64e075b02f515ca, 0xdff35e384e663195 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r45, -4690\n"
                      "shl16insli r45, r45, 18437\n"
                      "shl16insli r45, r45, 14549\n"
                      "shl16insli r45, r45, -22291\n"
                      "moveli r7, 15584\n"
                      "shl16insli r7, r7, -16025\n"
                      "shl16insli r7, r7, 24621\n"
                      "shl16insli r7, r7, -25450\n"
                      "moveli r2, -16204\n"
                      "shl16insli r2, r2, -989\n"
                      "shl16insli r2, r2, -29843\n"
                      "shl16insli r2, r2, -32026\n"
                      "{ mula_hs_lu r45, r7, r2 ; fnop   }\n"
                      "move %0, r45\n"
                      "move %1, r7\n"
                      "move %2, r2\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
