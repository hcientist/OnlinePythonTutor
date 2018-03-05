//file: _insn_test_shl2add_Y1.c
//op=192
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

unsigned long mem[2] = { 0x7c6741cd8294f113, 0x7df20b112210ce2f };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r0, -28670\n"
                      "shl16insli r0, r0, -6265\n"
                      "shl16insli r0, r0, 15425\n"
                      "shl16insli r0, r0, 17326\n"
                      "moveli r19, 7596\n"
                      "shl16insli r19, r19, -10648\n"
                      "shl16insli r19, r19, 15573\n"
                      "shl16insli r19, r19, -25790\n"
                      "moveli r43, -7218\n"
                      "shl16insli r43, r43, 7896\n"
                      "shl16insli r43, r43, -22888\n"
                      "shl16insli r43, r43, -25968\n"
                      "{ fnop  ; shl2add r0, r19, r43 ; ld r63, r54  }\n"
                      "move %0, r0\n"
                      "move %1, r19\n"
                      "move %2, r43\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
