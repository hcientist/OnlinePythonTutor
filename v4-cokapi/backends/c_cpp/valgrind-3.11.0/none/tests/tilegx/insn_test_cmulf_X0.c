//file: _insn_test_cmulf_X0.c
//op=67
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

unsigned long mem[2] = { 0x20a35a283e09bcf3, 0xf918ceb605460b8e };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r47, 12090\n"
                      "shl16insli r47, r47, -15392\n"
                      "shl16insli r47, r47, 393\n"
                      "shl16insli r47, r47, 9111\n"
                      "moveli r2, 22012\n"
                      "shl16insli r2, r2, 18909\n"
                      "shl16insli r2, r2, 17994\n"
                      "shl16insli r2, r2, -10137\n"
                      "moveli r46, 30081\n"
                      "shl16insli r46, r46, 2888\n"
                      "shl16insli r46, r46, 17535\n"
                      "shl16insli r46, r46, -29480\n"
                      "{ cmulf r47, r2, r46 ; fnop   }\n"
                      "move %0, r47\n"
                      "move %1, r2\n"
                      "move %2, r46\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
