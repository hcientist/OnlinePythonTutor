//file: _insn_test_tblidxb0_X0.c
//op=229
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

unsigned long mem[2] = { 0x31b68d06344a9475, 0xebc9dd79c7a87a22 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r5, -1618\n"
                      "shl16insli r5, r5, -6082\n"
                      "shl16insli r5, r5, 16233\n"
                      "shl16insli r5, r5, -1212\n"
                      "moveli r13, -29258\n"
                      "shl16insli r13, r13, -8488\n"
                      "shl16insli r13, r13, -31577\n"
                      "shl16insli r13, r13, 27843\n"
                      "{ tblidxb0 r5, r13 ; fnop   }\n"
                      "move %0, r5\n"
                      "move %1, r13\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
