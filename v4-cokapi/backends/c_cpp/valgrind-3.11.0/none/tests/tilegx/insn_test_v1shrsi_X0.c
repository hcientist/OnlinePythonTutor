//file: _insn_test_v1shrsi_X0.c
//op=273
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

unsigned long mem[2] = { 0x99db15856c0b4de, 0x7721cf058b98c6d4 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r5, -12155\n"
                      "shl16insli r5, r5, -29090\n"
                      "shl16insli r5, r5, 11972\n"
                      "shl16insli r5, r5, -26553\n"
                      "moveli r17, 13958\n"
                      "shl16insli r17, r17, -23061\n"
                      "shl16insli r17, r17, -20\n"
                      "shl16insli r17, r17, 9148\n"
                      "{ v1shrsi r5, r17, 58 ; fnop   }\n"
                      "move %0, r5\n"
                      "move %1, r17\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
