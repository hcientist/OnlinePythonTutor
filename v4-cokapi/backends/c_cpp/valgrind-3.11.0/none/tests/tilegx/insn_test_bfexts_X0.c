//file: _insn_test_bfexts_X0.c
//op=33
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

unsigned long mem[2] = { 0x159952beef1e2d8e, 0x344fa86966757d1d };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r29, 14446\n"
                      "shl16insli r29, r29, 26605\n"
                      "shl16insli r29, r29, 31496\n"
                      "shl16insli r29, r29, -24631\n"
                      "moveli r9, -15179\n"
                      "shl16insli r9, r9, 29659\n"
                      "shl16insli r9, r9, 32207\n"
                      "shl16insli r9, r9, 7899\n"
                      "{ bfexts r29, r9, 11, 9 ; fnop   }\n"
                      "move %0, r29\n"
                      "move %1, r9\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
