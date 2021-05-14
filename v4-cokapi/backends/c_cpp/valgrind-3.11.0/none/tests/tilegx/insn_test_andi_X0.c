//file: _insn_test_andi_X0.c
//op=30
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

unsigned long mem[2] = { 0xd5c03dafaeab4e7e, 0xbca200a47bf08fef };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r46, -22782\n"
                      "shl16insli r46, r46, -24188\n"
                      "shl16insli r46, r46, -5494\n"
                      "shl16insli r46, r46, 12791\n"
                      "moveli r3, -24353\n"
                      "shl16insli r3, r3, 7605\n"
                      "shl16insli r3, r3, -19417\n"
                      "shl16insli r3, r3, 15971\n"
                      "{ andi r46, r3, 96 ; fnop   }\n"
                      "move %0, r46\n"
                      "move %1, r3\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
