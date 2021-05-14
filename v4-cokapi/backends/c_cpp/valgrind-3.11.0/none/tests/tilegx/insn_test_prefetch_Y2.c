//file: _insn_test_prefetch_Y2.c
//op=8
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

unsigned long mem[2] = { 0xd941c90b89d1197b, 0x9f2fd3736342eb2e };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r5, -20979\n"
                      "shl16insli r5, r5, 31723\n"
                      "shl16insli r5, r5, 27537\n"
                      "shl16insli r5, r5, -30979\n"
                      "{ fnop  ; fnop  ; prefetch r5  }\n"
                      "move %0, r5\n"
                      :"=r"(a[0]));
    printf("%016lx\n", a[0]);
    return 0;
}
