//file: _insn_test_v1mz_X0.c
//op=267
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

unsigned long mem[2] = { 0x1b3ff0e0443a3be1, 0x220687ea6e937cd5 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r38, 4964\n"
                      "shl16insli r38, r38, -27298\n"
                      "shl16insli r38, r38, 27287\n"
                      "shl16insli r38, r38, 25242\n"
                      "moveli r45, 12630\n"
                      "shl16insli r45, r45, 24867\n"
                      "shl16insli r45, r45, -32060\n"
                      "shl16insli r45, r45, 29383\n"
                      "moveli r38, -6355\n"
                      "shl16insli r38, r38, -29829\n"
                      "shl16insli r38, r38, 8624\n"
                      "shl16insli r38, r38, -6732\n"
                      "{ v1mz r38, r45, r38 ; fnop   }\n"
                      "move %0, r38\n"
                      "move %1, r45\n"
                      "move %2, r38\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
