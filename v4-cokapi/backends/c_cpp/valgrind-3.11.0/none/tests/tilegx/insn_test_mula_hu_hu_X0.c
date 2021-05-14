//file: _insn_test_mula_hu_hu_X0.c
//op=169
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

unsigned long mem[2] = { 0xa479dc4ef3600b13, 0x286401a31761e02a };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r0, -9560\n"
                      "shl16insli r0, r0, 27577\n"
                      "shl16insli r0, r0, -8798\n"
                      "shl16insli r0, r0, 25385\n"
                      "moveli r47, -17024\n"
                      "shl16insli r47, r47, -8491\n"
                      "shl16insli r47, r47, 31461\n"
                      "shl16insli r47, r47, -10531\n"
                      "moveli r35, 13663\n"
                      "shl16insli r35, r35, 11635\n"
                      "shl16insli r35, r35, -24944\n"
                      "shl16insli r35, r35, -3616\n"
                      "{ mula_hu_hu r0, r47, r35 ; fnop   }\n"
                      "move %0, r0\n"
                      "move %1, r47\n"
                      "move %2, r35\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
