//file: _insn_test_v4sub_X1.c
//op=330
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

unsigned long mem[2] = { 0xa3c6a3690a9f8085, 0xec7e102d827fb085 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r27, 16489\n"
                      "shl16insli r27, r27, 1852\n"
                      "shl16insli r27, r27, -22328\n"
                      "shl16insli r27, r27, -20016\n"
                      "moveli r15, -8129\n"
                      "shl16insli r15, r15, -16265\n"
                      "shl16insli r15, r15, -27946\n"
                      "shl16insli r15, r15, 22744\n"
                      "moveli r28, 12168\n"
                      "shl16insli r28, r28, 24071\n"
                      "shl16insli r28, r28, 5574\n"
                      "shl16insli r28, r28, 21456\n"
                      "{ fnop  ; v4sub r27, r15, r28  }\n"
                      "move %0, r27\n"
                      "move %1, r15\n"
                      "move %2, r28\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
