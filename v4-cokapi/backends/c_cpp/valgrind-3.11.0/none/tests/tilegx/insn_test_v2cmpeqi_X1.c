//file: _insn_test_v2cmpeqi_X1.c
//op=284
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

unsigned long mem[2] = { 0x8313ffac0a7611da, 0xa6a582b3dc8f6e83 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r26, -30297\n"
                      "shl16insli r26, r26, -30363\n"
                      "shl16insli r26, r26, -30605\n"
                      "shl16insli r26, r26, 3831\n"
                      "moveli r35, 7782\n"
                      "shl16insli r35, r35, 2739\n"
                      "shl16insli r35, r35, -10491\n"
                      "shl16insli r35, r35, -19368\n"
                      "{ fnop  ; v2cmpeqi r26, r35, 63  }\n"
                      "move %0, r26\n"
                      "move %1, r35\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
