//file: _insn_test_v1dotpa_X0.c
//op=252
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

unsigned long mem[2] = { 0xd02416e43b19c3f1, 0xb50b19b244ac7eb4 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r4, 15584\n"
                      "shl16insli r4, r4, -16025\n"
                      "shl16insli r4, r4, 24621\n"
                      "shl16insli r4, r4, -25450\n"
                      "moveli r7, 14194\n"
                      "shl16insli r7, r7, 6886\n"
                      "shl16insli r7, r7, -25858\n"
                      "shl16insli r7, r7, -24609\n"
                      "moveli r0, 12923\n"
                      "shl16insli r0, r0, -8055\n"
                      "shl16insli r0, r0, -31361\n"
                      "shl16insli r0, r0, -7893\n"
                      "{ v1dotpa r4, r7, r0 ; fnop   }\n"
                      "move %0, r4\n"
                      "move %1, r7\n"
                      "move %2, r0\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
