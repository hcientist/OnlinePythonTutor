//file: _insn_test_v2maxs_X1.c
//op=296
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

unsigned long mem[2] = { 0xd673caed17b8f6b3, 0xd67c5353b4f83951 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r17, -9565\n"
                      "shl16insli r17, r17, -2221\n"
                      "shl16insli r17, r17, 28285\n"
                      "shl16insli r17, r17, -15121\n"
                      "moveli r49, -7514\n"
                      "shl16insli r49, r49, -32499\n"
                      "shl16insli r49, r49, -9013\n"
                      "shl16insli r49, r49, -11291\n"
                      "moveli r38, -30570\n"
                      "shl16insli r38, r38, 23912\n"
                      "shl16insli r38, r38, -22856\n"
                      "shl16insli r38, r38, 8963\n"
                      "{ fnop  ; v2maxs r17, r49, r38  }\n"
                      "move %0, r17\n"
                      "move %1, r49\n"
                      "move %2, r38\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
