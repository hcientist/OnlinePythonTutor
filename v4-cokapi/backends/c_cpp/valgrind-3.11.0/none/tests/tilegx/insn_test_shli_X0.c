//file: _insn_test_shli_X0.c
//op=196
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

unsigned long mem[2] = { 0x555a73f8e7686b53, 0xca681c3c17f1785e };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r3, -17698\n"
                      "shl16insli r3, r3, -1407\n"
                      "shl16insli r3, r3, 3238\n"
                      "shl16insli r3, r3, 14331\n"
                      "moveli r38, -19915\n"
                      "shl16insli r38, r38, -2852\n"
                      "shl16insli r38, r38, 32613\n"
                      "shl16insli r38, r38, 14940\n"
                      "{ shli r3, r38, 16 ; fnop   }\n"
                      "move %0, r3\n"
                      "move %1, r38\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
