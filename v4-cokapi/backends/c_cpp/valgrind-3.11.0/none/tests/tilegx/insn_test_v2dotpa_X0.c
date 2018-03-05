//file: _insn_test_v2dotpa_X0.c
//op=293
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

unsigned long mem[2] = { 0xf3a626370b91d897, 0xecbff88d5bcc8c90 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r17, 6194\n"
                      "shl16insli r17, r17, 2413\n"
                      "shl16insli r17, r17, 21362\n"
                      "shl16insli r17, r17, 21211\n"
                      "moveli r8, 14829\n"
                      "shl16insli r8, r8, 23848\n"
                      "shl16insli r8, r8, 17951\n"
                      "shl16insli r8, r8, -953\n"
                      "moveli r25, 21203\n"
                      "shl16insli r25, r25, -13101\n"
                      "shl16insli r25, r25, 14734\n"
                      "shl16insli r25, r25, -27100\n"
                      "{ v2dotpa r17, r8, r25 ; fnop   }\n"
                      "move %0, r17\n"
                      "move %1, r8\n"
                      "move %2, r25\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
