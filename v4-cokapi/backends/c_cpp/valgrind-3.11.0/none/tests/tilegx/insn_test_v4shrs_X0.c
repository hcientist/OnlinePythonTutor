//file: _insn_test_v4shrs_X0.c
//op=328
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

unsigned long mem[2] = { 0x2a5face79840f7a7, 0xd75570c277b73b03 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r34, 2928\n"
                      "shl16insli r34, r34, -22351\n"
                      "shl16insli r34, r34, 15965\n"
                      "shl16insli r34, r34, -15676\n"
                      "moveli r34, 24886\n"
                      "shl16insli r34, r34, 6119\n"
                      "shl16insli r34, r34, -23856\n"
                      "shl16insli r34, r34, -8685\n"
                      "moveli r45, 1295\n"
                      "shl16insli r45, r45, -12278\n"
                      "shl16insli r45, r45, -23875\n"
                      "shl16insli r45, r45, 20883\n"
                      "{ v4shrs r34, r34, r45 ; fnop   }\n"
                      "move %0, r34\n"
                      "move %1, r34\n"
                      "move %2, r45\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
