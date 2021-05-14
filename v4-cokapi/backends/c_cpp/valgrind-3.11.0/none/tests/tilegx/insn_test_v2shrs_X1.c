//file: _insn_test_v2shrs_X1.c
//op=315
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

unsigned long mem[2] = { 0x2e2bf09c65385753, 0xebdd0a243fdaeac0 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r27, -11697\n"
                      "shl16insli r27, r27, 28366\n"
                      "shl16insli r27, r27, -10445\n"
                      "shl16insli r27, r27, -26110\n"
                      "moveli r43, 19765\n"
                      "shl16insli r43, r43, 31767\n"
                      "shl16insli r43, r43, 18729\n"
                      "shl16insli r43, r43, 27881\n"
                      "moveli r4, -18306\n"
                      "shl16insli r4, r4, 19057\n"
                      "shl16insli r4, r4, 16125\n"
                      "shl16insli r4, r4, -18666\n"
                      "{ fnop  ; v2shrs r27, r43, r4  }\n"
                      "move %0, r27\n"
                      "move %1, r43\n"
                      "move %2, r4\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
