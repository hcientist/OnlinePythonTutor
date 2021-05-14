//file: _insn_test_cmples_Y1.c
//op=57
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

unsigned long mem[2] = { 0xd4017cfe9fa6ebaa, 0x98d3e0700ab2b8d9 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r34, -26683\n"
                      "shl16insli r34, r34, 3096\n"
                      "shl16insli r34, r34, 25335\n"
                      "shl16insli r34, r34, 30983\n"
                      "moveli r26, -7486\n"
                      "shl16insli r26, r26, 24081\n"
                      "shl16insli r26, r26, 2997\n"
                      "shl16insli r26, r26, -26298\n"
                      "moveli r32, -10199\n"
                      "shl16insli r32, r32, -13638\n"
                      "shl16insli r32, r32, 17992\n"
                      "shl16insli r32, r32, -16829\n"
                      "{ fnop  ; cmples r34, r26, r32 ; ld r63, r54  }\n"
                      "move %0, r34\n"
                      "move %1, r26\n"
                      "move %2, r32\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
