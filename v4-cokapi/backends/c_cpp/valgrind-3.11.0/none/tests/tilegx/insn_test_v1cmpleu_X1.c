//file: _insn_test_v1cmpleu_X1.c
//op=241
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

unsigned long mem[2] = { 0xf650c1dfb5e7ad42, 0x58b08e812190ba77 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r3, -2057\n"
                      "shl16insli r3, r3, 27159\n"
                      "shl16insli r3, r3, -22172\n"
                      "shl16insli r3, r3, 8048\n"
                      "moveli r8, -12225\n"
                      "shl16insli r8, r8, -10603\n"
                      "shl16insli r8, r8, 1383\n"
                      "shl16insli r8, r8, -9619\n"
                      "moveli r14, -24673\n"
                      "shl16insli r14, r14, 32616\n"
                      "shl16insli r14, r14, 28197\n"
                      "shl16insli r14, r14, -4516\n"
                      "{ fnop  ; v1cmpleu r3, r8, r14  }\n"
                      "move %0, r3\n"
                      "move %1, r8\n"
                      "move %2, r14\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
