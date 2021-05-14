//file: _insn_test_fdouble_unpack_min_X0.c
//op=89
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

unsigned long mem[2] = { 0xc7396f52c760a9d3, 0x4bf0ef1260a5545f };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r34, -29325\n"
                      "shl16insli r34, r34, 23863\n"
                      "shl16insli r34, r34, -25021\n"
                      "shl16insli r34, r34, -17019\n"
                      "moveli r35, 6975\n"
                      "shl16insli r35, r35, -3872\n"
                      "shl16insli r35, r35, 17466\n"
                      "shl16insli r35, r35, 15329\n"
                      "moveli r3, -10923\n"
                      "shl16insli r3, r3, 19053\n"
                      "shl16insli r3, r3, 1173\n"
                      "shl16insli r3, r3, -17395\n"
                      "{ fdouble_unpack_min r34, r35, r3 ; fnop   }\n"
                      "move %0, r34\n"
                      "move %1, r35\n"
                      "move %2, r3\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
