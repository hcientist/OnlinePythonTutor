//file: _insn_test_nor_Y0.c
//op=180
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

unsigned long mem[2] = { 0xd104e6fedbd326fa, 0xa0df1db5b4273e63 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r22, 9517\n"
                      "shl16insli r22, r22, -14743\n"
                      "shl16insli r22, r22, 28886\n"
                      "shl16insli r22, r22, 23646\n"
                      "moveli r8, 31287\n"
                      "shl16insli r8, r8, -16865\n"
                      "shl16insli r8, r8, 32203\n"
                      "shl16insli r8, r8, 26808\n"
                      "moveli r7, -18162\n"
                      "shl16insli r7, r7, 4413\n"
                      "shl16insli r7, r7, 14247\n"
                      "shl16insli r7, r7, 14892\n"
                      "{ nor r22, r8, r7 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r22\n"
                      "move %1, r8\n"
                      "move %2, r7\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
