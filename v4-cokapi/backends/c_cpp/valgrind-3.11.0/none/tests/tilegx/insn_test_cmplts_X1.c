//file: _insn_test_cmplts_X1.c
//op=59
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

unsigned long mem[2] = { 0xdfe94ab09fee22a5, 0x379c002b0119bd52 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r3, -11368\n"
                      "shl16insli r3, r3, -9764\n"
                      "shl16insli r3, r3, -880\n"
                      "shl16insli r3, r3, -31125\n"
                      "moveli r31, -25744\n"
                      "shl16insli r31, r31, -23478\n"
                      "shl16insli r31, r31, -21167\n"
                      "shl16insli r31, r31, -9956\n"
                      "moveli r9, 19348\n"
                      "shl16insli r9, r9, 13914\n"
                      "shl16insli r9, r9, -27396\n"
                      "shl16insli r9, r9, -31879\n"
                      "{ fnop  ; cmplts r3, r31, r9  }\n"
                      "move %0, r3\n"
                      "move %1, r31\n"
                      "move %2, r9\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
