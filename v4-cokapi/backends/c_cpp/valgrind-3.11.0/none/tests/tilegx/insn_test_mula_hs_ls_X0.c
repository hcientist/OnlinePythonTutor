//file: _insn_test_mula_hs_ls_X0.c
//op=167
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

unsigned long mem[2] = { 0x334d1321b4c11950, 0x4406ad0fa9c44e77 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r37, 47\n"
                      "shl16insli r37, r37, 27756\n"
                      "shl16insli r37, r37, -285\n"
                      "shl16insli r37, r37, 5847\n"
                      "moveli r14, -22393\n"
                      "shl16insli r14, r14, -5429\n"
                      "shl16insli r14, r14, -14300\n"
                      "shl16insli r14, r14, 11616\n"
                      "moveli r1, 31370\n"
                      "shl16insli r1, r1, -7442\n"
                      "shl16insli r1, r1, 26409\n"
                      "shl16insli r1, r1, 25903\n"
                      "{ mula_hs_ls r37, r14, r1 ; fnop   }\n"
                      "move %0, r37\n"
                      "move %1, r14\n"
                      "move %2, r1\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
