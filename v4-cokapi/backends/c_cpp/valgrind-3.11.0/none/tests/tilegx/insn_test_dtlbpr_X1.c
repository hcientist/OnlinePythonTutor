//file: _insn_test_dtlbpr_X1.c
//op=79
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

unsigned long mem[2] = { 0x910a2955c6e71b1, 0x884eacaf96426585 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r6, 6476\n"
                      "shl16insli r6, r6, -30926\n"
                      "shl16insli r6, r6, 24920\n"
                      "shl16insli r6, r6, 10073\n"
                      "{ fnop  ; dtlbpr r6  }\n"
                      "move %0, r6\n"
                      :"=r"(a[0]));
    printf("%016lx\n", a[0]);
    return 0;
}
