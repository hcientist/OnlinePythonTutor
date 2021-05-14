//file: _insn_test_shrux_X1.c
//op=203
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

unsigned long mem[2] = { 0xc37f982bb51ed5f2, 0xeb5eb16625bf3fb };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r42, -7121\n"
                      "shl16insli r42, r42, -30624\n"
                      "shl16insli r42, r42, -1997\n"
                      "shl16insli r42, r42, 26909\n"
                      "moveli r49, -18112\n"
                      "shl16insli r49, r49, -30675\n"
                      "shl16insli r49, r49, -20511\n"
                      "shl16insli r49, r49, 26134\n"
                      "moveli r35, 5545\n"
                      "shl16insli r35, r35, 27154\n"
                      "shl16insli r35, r35, -18159\n"
                      "shl16insli r35, r35, 26569\n"
                      "{ fnop  ; shrux r42, r49, r35  }\n"
                      "move %0, r42\n"
                      "move %1, r49\n"
                      "move %2, r35\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
