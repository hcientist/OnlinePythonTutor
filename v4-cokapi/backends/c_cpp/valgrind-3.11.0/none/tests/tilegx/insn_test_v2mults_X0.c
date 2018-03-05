//file: _insn_test_v2mults_X0.c
//op=303
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

unsigned long mem[2] = { 0x10a358c86acccf50, 0xdf11630124acb01a };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r9, 4497\n"
                      "shl16insli r9, r9, 8011\n"
                      "shl16insli r9, r9, -29488\n"
                      "shl16insli r9, r9, -23563\n"
                      "moveli r39, -24360\n"
                      "shl16insli r39, r39, 26052\n"
                      "shl16insli r39, r39, -30688\n"
                      "shl16insli r39, r39, -6964\n"
                      "moveli r46, 14490\n"
                      "shl16insli r46, r46, 13586\n"
                      "shl16insli r46, r46, -31514\n"
                      "shl16insli r46, r46, -17044\n"
                      "{ v2mults r9, r39, r46 ; fnop   }\n"
                      "move %0, r9\n"
                      "move %1, r39\n"
                      "move %2, r46\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
