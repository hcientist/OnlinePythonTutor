//file: _insn_test_movei_X0.c
//op=6
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

unsigned long mem[2] = { 0xd65eb4d9fa5bdd9a, 0x1c0a7303af5ad0fd };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r38, -24632\n"
                      "shl16insli r38, r38, -1299\n"
                      "shl16insli r38, r38, 29324\n"
                      "shl16insli r38, r38, -18232\n"
                      "{ movei r38, -17 ; fnop   }\n"
                      "move %0, r38\n"
                      :"=r"(a[0]));
    printf("%016lx\n", a[0]);
    return 0;
}
