//file: _insn_test_v2mz_X1.c
//op=304
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

unsigned long mem[2] = { 0xdf8a8efd3fbdf7df, 0x9d9b78ac30042683 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r1, -1899\n"
                      "shl16insli r1, r1, -8825\n"
                      "shl16insli r1, r1, -7773\n"
                      "shl16insli r1, r1, -2647\n"
                      "moveli r26, -32534\n"
                      "shl16insli r26, r26, -13813\n"
                      "shl16insli r26, r26, -14272\n"
                      "shl16insli r26, r26, -25134\n"
                      "moveli r32, -5907\n"
                      "shl16insli r32, r32, 24588\n"
                      "shl16insli r32, r32, -15094\n"
                      "shl16insli r32, r32, 11658\n"
                      "{ fnop  ; v2mz r1, r26, r32  }\n"
                      "move %0, r1\n"
                      "move %1, r26\n"
                      "move %2, r32\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
