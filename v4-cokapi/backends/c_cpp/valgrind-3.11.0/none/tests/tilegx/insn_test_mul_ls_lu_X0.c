//file: _insn_test_mul_ls_lu_X0.c
//op=163
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

unsigned long mem[2] = { 0xcdce8cd30da8f45b, 0x85932185df148d8d };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r2, -19516\n"
                      "shl16insli r2, r2, -21805\n"
                      "shl16insli r2, r2, -31810\n"
                      "shl16insli r2, r2, 31088\n"
                      "moveli r32, 3846\n"
                      "shl16insli r32, r32, -1507\n"
                      "shl16insli r32, r32, -17183\n"
                      "shl16insli r32, r32, -527\n"
                      "moveli r4, 25062\n"
                      "shl16insli r4, r4, -3688\n"
                      "shl16insli r4, r4, 15670\n"
                      "shl16insli r4, r4, 15480\n"
                      "{ mul_ls_lu r2, r32, r4 ; fnop   }\n"
                      "move %0, r2\n"
                      "move %1, r32\n"
                      "move %2, r4\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
