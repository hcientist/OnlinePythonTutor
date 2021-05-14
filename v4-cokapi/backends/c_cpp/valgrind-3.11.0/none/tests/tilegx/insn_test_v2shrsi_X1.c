//file: _insn_test_v2shrsi_X1.c
//op=316
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

unsigned long mem[2] = { 0x7c9257e7675dc02e, 0x194c873261582759 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r29, -19874\n"
                      "shl16insli r29, r29, -32652\n"
                      "shl16insli r29, r29, -27551\n"
                      "shl16insli r29, r29, 14010\n"
                      "moveli r39, -29195\n"
                      "shl16insli r39, r39, -14971\n"
                      "shl16insli r39, r39, 21267\n"
                      "shl16insli r39, r39, -6933\n"
                      "{ fnop  ; v2shrsi r29, r39, 29  }\n"
                      "move %0, r29\n"
                      "move %1, r39\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
