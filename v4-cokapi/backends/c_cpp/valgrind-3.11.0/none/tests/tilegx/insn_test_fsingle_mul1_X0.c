//file: _insn_test_fsingle_mul1_X0.c
//op=104
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

unsigned long mem[2] = { 0xe22608b00f39a4c5, 0x9276743f21019b4e };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r32, -27396\n"
                      "shl16insli r32, r32, -8056\n"
                      "shl16insli r32, r32, 23879\n"
                      "shl16insli r32, r32, 14131\n"
                      "moveli r4, 4550\n"
                      "shl16insli r4, r4, 29355\n"
                      "shl16insli r4, r4, 30941\n"
                      "shl16insli r4, r4, 29755\n"
                      "moveli r38, -21466\n"
                      "shl16insli r38, r38, 11354\n"
                      "shl16insli r38, r38, -10374\n"
                      "shl16insli r38, r38, 87\n"
                      "{ fsingle_mul1 r32, r4, r38 ; fnop   }\n"
                      "move %0, r32\n"
                      "move %1, r4\n"
                      "move %2, r38\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
