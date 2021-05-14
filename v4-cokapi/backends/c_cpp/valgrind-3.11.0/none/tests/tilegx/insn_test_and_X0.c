//file: _insn_test_and_X0.c
//op=29
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

unsigned long mem[2] = { 0x6fd6d80e8b18c9bb, 0xe18dcaef23b64e7 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r38, -25962\n"
                      "shl16insli r38, r38, -29618\n"
                      "shl16insli r38, r38, 9810\n"
                      "shl16insli r38, r38, -7855\n"
                      "moveli r16, -14420\n"
                      "shl16insli r16, r16, 14085\n"
                      "shl16insli r16, r16, 14918\n"
                      "shl16insli r16, r16, 4353\n"
                      "moveli r13, -12524\n"
                      "shl16insli r13, r13, -16020\n"
                      "shl16insli r13, r13, -28698\n"
                      "shl16insli r13, r13, -10230\n"
                      "{ and r38, r16, r13 ; fnop   }\n"
                      "move %0, r38\n"
                      "move %1, r16\n"
                      "move %2, r13\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
