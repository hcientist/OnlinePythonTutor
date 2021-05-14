//file: _insn_test_v2adiffs_X0.c
//op=281
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

unsigned long mem[2] = { 0x6f21f4f815dfb72, 0x5b4570159a31813a };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r10, -15907\n"
                      "shl16insli r10, r10, 8951\n"
                      "shl16insli r10, r10, -9037\n"
                      "shl16insli r10, r10, 10333\n"
                      "moveli r5, -798\n"
                      "shl16insli r5, r5, -2293\n"
                      "shl16insli r5, r5, -26610\n"
                      "shl16insli r5, r5, -17\n"
                      "moveli r39, -3845\n"
                      "shl16insli r39, r39, -15318\n"
                      "shl16insli r39, r39, 29335\n"
                      "shl16insli r39, r39, 30594\n"
                      "{ v2adiffs r10, r5, r39 ; fnop   }\n"
                      "move %0, r10\n"
                      "move %1, r5\n"
                      "move %2, r39\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
