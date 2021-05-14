//file: _insn_test_fdouble_sub_flags_X0.c
//op=87
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

unsigned long mem[2] = { 0xc7ac37053a461101, 0xf55855739bded624 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r1, -25048\n"
                      "shl16insli r1, r1, -26391\n"
                      "shl16insli r1, r1, -12179\n"
                      "shl16insli r1, r1, -11222\n"
                      "moveli r17, -6657\n"
                      "shl16insli r17, r17, -8617\n"
                      "shl16insli r17, r17, 10307\n"
                      "shl16insli r17, r17, 8268\n"
                      "moveli r42, -11842\n"
                      "shl16insli r42, r42, 25434\n"
                      "shl16insli r42, r42, -11416\n"
                      "shl16insli r42, r42, -1334\n"
                      "{ fdouble_sub_flags r1, r17, r42 ; fnop   }\n"
                      "move %0, r1\n"
                      "move %1, r17\n"
                      "move %2, r42\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
