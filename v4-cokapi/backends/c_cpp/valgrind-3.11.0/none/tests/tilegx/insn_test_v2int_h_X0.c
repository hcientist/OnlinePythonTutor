//file: _insn_test_v2int_h_X0.c
//op=294
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

unsigned long mem[2] = { 0x97e13a21591a3024, 0x5d9ea0967d2b4507 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r43, -19915\n"
                      "shl16insli r43, r43, -2852\n"
                      "shl16insli r43, r43, 32613\n"
                      "shl16insli r43, r43, 14940\n"
                      "moveli r42, -8260\n"
                      "shl16insli r42, r42, -23578\n"
                      "shl16insli r42, r42, -18362\n"
                      "shl16insli r42, r42, 19495\n"
                      "moveli r21, -29446\n"
                      "shl16insli r21, r21, -10554\n"
                      "shl16insli r21, r21, 9903\n"
                      "shl16insli r21, r21, -20470\n"
                      "{ v2int_h r43, r42, r21 ; fnop   }\n"
                      "move %0, r43\n"
                      "move %1, r42\n"
                      "move %2, r21\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
