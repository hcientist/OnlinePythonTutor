//file: _insn_test_shufflebytes_X0.c
//op=205
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

unsigned long mem[2] = { 0xa6483705cd54508, 0x21d4110911f94e5 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r32, -22776\n"
                      "shl16insli r32, r32, 13201\n"
                      "shl16insli r32, r32, 12503\n"
                      "shl16insli r32, r32, -18616\n"
                      "moveli r31, -22828\n"
                      "shl16insli r31, r31, -15690\n"
                      "shl16insli r31, r31, 1274\n"
                      "shl16insli r31, r31, 1723\n"
                      "moveli r45, -14449\n"
                      "shl16insli r45, r45, -2545\n"
                      "shl16insli r45, r45, -8339\n"
                      "shl16insli r45, r45, 221\n"
                      "{ shufflebytes r32, r31, r45 ; fnop   }\n"
                      "move %0, r32\n"
                      "move %1, r31\n"
                      "move %2, r45\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
