//file: _insn_test_v2sadu_X0.c
//op=311
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

unsigned long mem[2] = { 0x16b1b65c0b6644ef, 0x11cdf52de566595 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r9, 31657\n"
                      "shl16insli r9, r9, -25836\n"
                      "shl16insli r9, r9, 8322\n"
                      "shl16insli r9, r9, -9300\n"
                      "moveli r34, -25603\n"
                      "shl16insli r34, r34, -29751\n"
                      "shl16insli r34, r34, 11341\n"
                      "shl16insli r34, r34, 7895\n"
                      "moveli r1, 15964\n"
                      "shl16insli r1, r1, 23061\n"
                      "shl16insli r1, r1, -7003\n"
                      "shl16insli r1, r1, 27153\n"
                      "{ v2sadu r9, r34, r1 ; fnop   }\n"
                      "move %0, r9\n"
                      "move %1, r34\n"
                      "move %2, r1\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
