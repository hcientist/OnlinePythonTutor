//file: _insn_test_crc32_32_X0.c
//op=71
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

unsigned long mem[2] = { 0x5797c115d06a021e, 0xcec6c9aa9564502a };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r21, -22875\n"
                      "shl16insli r21, r21, -32077\n"
                      "shl16insli r21, r21, -9073\n"
                      "shl16insli r21, r21, 28291\n"
                      "moveli r18, -19329\n"
                      "shl16insli r18, r18, -4231\n"
                      "shl16insli r18, r18, 22518\n"
                      "shl16insli r18, r18, 1958\n"
                      "moveli r23, -31981\n"
                      "shl16insli r23, r23, -84\n"
                      "shl16insli r23, r23, 2678\n"
                      "shl16insli r23, r23, 4570\n"
                      "{ crc32_32 r21, r18, r23 ; fnop   }\n"
                      "move %0, r21\n"
                      "move %1, r18\n"
                      "move %2, r23\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
