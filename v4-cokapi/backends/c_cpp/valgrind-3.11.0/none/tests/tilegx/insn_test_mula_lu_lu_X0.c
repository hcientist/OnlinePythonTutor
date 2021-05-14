//file: _insn_test_mula_lu_lu_X0.c
//op=174
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

unsigned long mem[2] = { 0x9e2898e9d06dd42a, 0xc7ac37053a461101 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r39, -11842\n"
                      "shl16insli r39, r39, 25434\n"
                      "shl16insli r39, r39, -11416\n"
                      "shl16insli r39, r39, -1334\n"
                      "moveli r38, -8159\n"
                      "shl16insli r38, r38, -19405\n"
                      "shl16insli r38, r38, -6882\n"
                      "shl16insli r38, r38, 24332\n"
                      "moveli r36, 11583\n"
                      "shl16insli r36, r36, -32720\n"
                      "shl16insli r36, r36, 17409\n"
                      "shl16insli r36, r36, -25838\n"
                      "{ mula_lu_lu r39, r38, r36 ; fnop   }\n"
                      "move %0, r39\n"
                      "move %1, r38\n"
                      "move %2, r36\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
