//file: _insn_test_cmulh_X0.c
//op=69
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

unsigned long mem[2] = { 0x4070076dbab015ca, 0x741405116e136ce3 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r26, 30607\n"
                      "shl16insli r26, r26, 12143\n"
                      "shl16insli r26, r26, 6105\n"
                      "shl16insli r26, r26, 59\n"
                      "moveli r3, -10033\n"
                      "shl16insli r3, r3, 14176\n"
                      "shl16insli r3, r3, -28670\n"
                      "shl16insli r3, r3, 13765\n"
                      "moveli r10, 8165\n"
                      "shl16insli r10, r10, 18793\n"
                      "shl16insli r10, r10, -22214\n"
                      "shl16insli r10, r10, 5498\n"
                      "{ cmulh r26, r3, r10 ; fnop   }\n"
                      "move %0, r26\n"
                      "move %1, r3\n"
                      "move %2, r10\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
