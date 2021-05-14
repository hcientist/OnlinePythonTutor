//file: _insn_test_v1adduc_X0.c
//op=235
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

unsigned long mem[2] = { 0x22ce703cb6ffeac4, 0x80948177d07e88f4 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r14, -13316\n"
                      "shl16insli r14, r14, -18141\n"
                      "shl16insli r14, r14, -11937\n"
                      "shl16insli r14, r14, -15394\n"
                      "moveli r19, -22708\n"
                      "shl16insli r19, r19, -32336\n"
                      "shl16insli r19, r19, -14907\n"
                      "shl16insli r19, r19, -32360\n"
                      "moveli r50, -3633\n"
                      "shl16insli r50, r50, -22778\n"
                      "shl16insli r50, r50, -18593\n"
                      "shl16insli r50, r50, -30611\n"
                      "{ v1adduc r14, r19, r50 ; fnop   }\n"
                      "move %0, r14\n"
                      "move %1, r19\n"
                      "move %2, r50\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
