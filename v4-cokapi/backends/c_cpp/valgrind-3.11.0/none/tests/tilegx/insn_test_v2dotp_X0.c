//file: _insn_test_v2dotp_X0.c
//op=292
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

unsigned long mem[2] = { 0x6be343892f498708, 0x52c49809e5465b06 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r9, 25552\n"
                      "shl16insli r9, r9, -32365\n"
                      "shl16insli r9, r9, 7253\n"
                      "shl16insli r9, r9, 12258\n"
                      "moveli r16, 31670\n"
                      "shl16insli r16, r16, 10120\n"
                      "shl16insli r16, r16, -14289\n"
                      "shl16insli r16, r16, -12244\n"
                      "moveli r25, 2217\n"
                      "shl16insli r25, r25, 23167\n"
                      "shl16insli r25, r25, 4870\n"
                      "shl16insli r25, r25, 31812\n"
                      "{ v2dotp r9, r16, r25 ; fnop   }\n"
                      "move %0, r9\n"
                      "move %1, r16\n"
                      "move %2, r25\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
