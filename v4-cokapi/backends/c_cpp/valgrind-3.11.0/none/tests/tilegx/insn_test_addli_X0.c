//file: _insn_test_addli_X0.c
//op=24
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

unsigned long mem[2] = { 0xeebea8448496854d, 0x9fc8faed728cb8c8 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r7, -15865\n"
                      "shl16insli r7, r7, -8928\n"
                      "shl16insli r7, r7, 2151\n"
                      "shl16insli r7, r7, -8089\n"
                      "moveli r8, 18685\n"
                      "shl16insli r8, r8, 5716\n"
                      "shl16insli r8, r8, -22554\n"
                      "shl16insli r8, r8, 27127\n"
                      "{ addli r7, r8, 12693 ; fnop   }\n"
                      "move %0, r7\n"
                      "move %1, r8\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
