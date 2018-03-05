//file: _insn_test_mm_X0.c
//op=152
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

unsigned long mem[2] = { 0x9d9b78ac30042683, 0xb17341a0d542c8a8 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r24, -8310\n"
                      "shl16insli r24, r24, -28931\n"
                      "shl16insli r24, r24, 16317\n"
                      "shl16insli r24, r24, -2081\n"
                      "moveli r31, -8094\n"
                      "shl16insli r31, r31, -3077\n"
                      "shl16insli r31, r31, 14718\n"
                      "shl16insli r31, r31, -8598\n"
                      "{ mm r24, r31, 34, 41 ; fnop   }\n"
                      "move %0, r24\n"
                      "move %1, r31\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
