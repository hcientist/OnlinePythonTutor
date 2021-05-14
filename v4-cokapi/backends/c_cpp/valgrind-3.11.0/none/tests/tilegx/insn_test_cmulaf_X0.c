//file: _insn_test_cmulaf_X0.c
//op=66
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

unsigned long mem[2] = { 0x386e67ed7b089fc9, 0x159952beef1e2d8e };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r17, 12406\n"
                      "shl16insli r17, r17, -7608\n"
                      "shl16insli r17, r17, -24144\n"
                      "shl16insli r17, r17, 13065\n"
                      "moveli r20, 14943\n"
                      "shl16insli r20, r20, -18119\n"
                      "shl16insli r20, r20, -10933\n"
                      "shl16insli r20, r20, 517\n"
                      "moveli r30, 26677\n"
                      "shl16insli r30, r30, 32003\n"
                      "shl16insli r30, r30, 16745\n"
                      "shl16insli r30, r30, -29543\n"
                      "{ cmulaf r17, r20, r30 ; fnop   }\n"
                      "move %0, r17\n"
                      "move %1, r20\n"
                      "move %2, r30\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
