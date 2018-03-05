//file: _insn_test_prefetch_l2_X1.c
//op=17
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

unsigned long mem[2] = { 0xbcd5fb19de288be, 0x10f22adff1ed0182 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r48, 2029\n"
                      "shl16insli r48, r48, -23766\n"
                      "shl16insli r48, r48, -9681\n"
                      "shl16insli r48, r48, 20576\n"
                      "{ fnop  ; prefetch_l2 r48  }\n"
                      "move %0, r48\n"
                      :"=r"(a[0]));
    printf("%016lx\n", a[0]);
    return 0;
}
