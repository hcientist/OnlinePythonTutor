//file: _insn_test_mula_ls_lu_X0.c
//op=173
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

unsigned long mem[2] = { 0x4a40d1e28d4a3d4a, 0x308f52b9c1ed029f };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r3, 14076\n"
                      "shl16insli r3, r3, -13318\n"
                      "shl16insli r3, r3, -31064\n"
                      "shl16insli r3, r3, 24882\n"
                      "moveli r2, 1130\n"
                      "shl16insli r2, r2, 19735\n"
                      "shl16insli r2, r2, 18026\n"
                      "shl16insli r2, r2, 2783\n"
                      "moveli r34, 22540\n"
                      "shl16insli r34, r34, -22507\n"
                      "shl16insli r34, r34, 24248\n"
                      "shl16insli r34, r34, 23620\n"
                      "{ mula_ls_lu r3, r2, r34 ; fnop   }\n"
                      "move %0, r3\n"
                      "move %1, r2\n"
                      "move %2, r34\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
