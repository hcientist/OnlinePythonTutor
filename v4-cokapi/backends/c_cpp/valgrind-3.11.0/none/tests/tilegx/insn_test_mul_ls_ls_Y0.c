//file: _insn_test_mul_ls_ls_Y0.c
//op=162
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

unsigned long mem[2] = { 0x228e8e83b7561e89, 0x175f6b2301c3969d };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r33, 9145\n"
                      "shl16insli r33, r33, 16129\n"
                      "shl16insli r33, r33, -28988\n"
                      "shl16insli r33, r33, -28265\n"
                      "moveli r47, -17072\n"
                      "shl16insli r47, r47, 26742\n"
                      "shl16insli r47, r47, -10023\n"
                      "shl16insli r47, r47, -32380\n"
                      "moveli r19, 7549\n"
                      "shl16insli r19, r19, -19041\n"
                      "shl16insli r19, r19, -30505\n"
                      "shl16insli r19, r19, -15011\n"
                      "{ mul_ls_ls r33, r47, r19 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r33\n"
                      "move %1, r47\n"
                      "move %2, r19\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
