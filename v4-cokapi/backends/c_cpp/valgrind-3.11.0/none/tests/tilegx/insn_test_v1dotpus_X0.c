//file: _insn_test_v1dotpus_X0.c
//op=255
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

unsigned long mem[2] = { 0xff2786a3390067bd, 0x12d0fd16d91f87d7 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r30, -20178\n"
                      "shl16insli r30, r30, 16109\n"
                      "shl16insli r30, r30, -17955\n"
                      "shl16insli r30, r30, 766\n"
                      "moveli r30, -16791\n"
                      "shl16insli r30, r30, -775\n"
                      "shl16insli r30, r30, 8064\n"
                      "shl16insli r30, r30, 31392\n"
                      "moveli r48, 2300\n"
                      "shl16insli r48, r48, 6845\n"
                      "shl16insli r48, r48, -2405\n"
                      "shl16insli r48, r48, 31247\n"
                      "{ v1dotpus r30, r30, r48 ; fnop   }\n"
                      "move %0, r30\n"
                      "move %1, r30\n"
                      "move %2, r48\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
