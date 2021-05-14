//file: _insn_test_v1int_h_X0.c
//op=257
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

unsigned long mem[2] = { 0xe9a8302931b95203, 0x70bdff1ab2dd150d };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r21, 8325\n"
                      "shl16insli r21, r21, -18852\n"
                      "shl16insli r21, r21, 5136\n"
                      "shl16insli r21, r21, 25114\n"
                      "moveli r14, -28465\n"
                      "shl16insli r14, r14, -20971\n"
                      "shl16insli r14, r14, 28669\n"
                      "shl16insli r14, r14, 5613\n"
                      "moveli r17, -533\n"
                      "shl16insli r17, r17, -12789\n"
                      "shl16insli r17, r17, -10981\n"
                      "shl16insli r17, r17, -30754\n"
                      "{ v1int_h r21, r14, r17 ; fnop   }\n"
                      "move %0, r21\n"
                      "move %1, r14\n"
                      "move %2, r17\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
