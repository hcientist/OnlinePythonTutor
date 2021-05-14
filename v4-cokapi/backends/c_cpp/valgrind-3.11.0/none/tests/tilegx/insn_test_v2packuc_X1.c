//file: _insn_test_v2packuc_X1.c
//op=307
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

unsigned long mem[2] = { 0xe14980afe3a8dcf2, 0x14a9d2cae102f39d };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r48, -14873\n"
                      "shl16insli r48, r48, 20437\n"
                      "shl16insli r48, r48, 1647\n"
                      "shl16insli r48, r48, -19288\n"
                      "moveli r2, 30869\n"
                      "shl16insli r2, r2, -5643\n"
                      "shl16insli r2, r2, 25290\n"
                      "shl16insli r2, r2, -10746\n"
                      "moveli r10, -14292\n"
                      "shl16insli r10, r10, -10131\n"
                      "shl16insli r10, r10, -22412\n"
                      "shl16insli r10, r10, -22005\n"
                      "{ fnop  ; v2packuc r48, r2, r10  }\n"
                      "move %0, r48\n"
                      "move %1, r2\n"
                      "move %2, r10\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
