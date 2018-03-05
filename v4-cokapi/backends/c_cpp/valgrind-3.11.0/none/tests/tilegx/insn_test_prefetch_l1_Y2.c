//file: _insn_test_prefetch_l1_Y2.c
//op=15
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

unsigned long mem[2] = { 0xbca200a47bf08fef, 0xcc8e27fe3fbcf86c };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r48, -10816\n"
                      "shl16insli r48, r48, 15791\n"
                      "shl16insli r48, r48, -20821\n"
                      "shl16insli r48, r48, 20094\n"
                      "{ fnop  ; fnop  ; prefetch r48  }\n"
                      "move %0, r48\n"
                      :"=r"(a[0]));
    printf("%016lx\n", a[0]);
    return 0;
}
