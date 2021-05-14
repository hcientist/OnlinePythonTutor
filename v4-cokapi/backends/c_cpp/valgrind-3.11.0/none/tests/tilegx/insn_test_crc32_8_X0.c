//file: _insn_test_crc32_8_X0.c
//op=72
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

unsigned long mem[2] = { 0x48fd1654a7e669f7, 0x3c14fa8c76bb7fe3 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r34, -1456\n"
                      "shl16insli r34, r34, -8976\n"
                      "shl16insli r34, r34, -20412\n"
                      "shl16insli r34, r34, -10854\n"
                      "moveli r38, -32379\n"
                      "shl16insli r38, r38, -17242\n"
                      "shl16insli r38, r38, -8818\n"
                      "shl16insli r38, r38, 7579\n"
                      "moveli r45, 26010\n"
                      "shl16insli r45, r45, -10170\n"
                      "shl16insli r45, r45, -10239\n"
                      "shl16insli r45, r45, -24168\n"
                      "{ crc32_8 r34, r38, r45 ; fnop   }\n"
                      "move %0, r34\n"
                      "move %1, r38\n"
                      "move %2, r45\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
