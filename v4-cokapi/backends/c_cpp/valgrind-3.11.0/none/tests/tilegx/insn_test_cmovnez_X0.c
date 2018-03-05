//file: _insn_test_cmovnez_X0.c
//op=52
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

unsigned long mem[2] = { 0x9276743f21019b4e, 0x82cd9e74ccb2b602 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r8, -7642\n"
                      "shl16insli r8, r8, 2224\n"
                      "shl16insli r8, r8, 3897\n"
                      "shl16insli r8, r8, -23355\n"
                      "moveli r24, 12753\n"
                      "shl16insli r24, r24, 12718\n"
                      "shl16insli r24, r24, 27517\n"
                      "shl16insli r24, r24, -23530\n"
                      "moveli r27, -27396\n"
                      "shl16insli r27, r27, -8056\n"
                      "shl16insli r27, r27, 23879\n"
                      "shl16insli r27, r27, 14131\n"
                      "{ cmovnez r8, r24, r27 ; fnop   }\n"
                      "move %0, r8\n"
                      "move %1, r24\n"
                      "move %2, r27\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
