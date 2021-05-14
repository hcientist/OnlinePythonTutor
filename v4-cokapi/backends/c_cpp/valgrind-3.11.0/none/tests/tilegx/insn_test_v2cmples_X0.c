//file: _insn_test_v2cmples_X0.c
//op=285
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

unsigned long mem[2] = { 0x6bc7185f1c32c400, 0x77be6930d1ff0375 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r22, 24574\n"
                      "shl16insli r22, r22, -7860\n"
                      "shl16insli r22, r22, 22844\n"
                      "shl16insli r22, r22, -25856\n"
                      "moveli r9, 30705\n"
                      "shl16insli r9, r9, -3754\n"
                      "shl16insli r9, r9, 28337\n"
                      "shl16insli r9, r9, -16712\n"
                      "moveli r50, -1269\n"
                      "shl16insli r50, r50, -3807\n"
                      "shl16insli r50, r50, -5572\n"
                      "shl16insli r50, r50, -28620\n"
                      "{ v2cmples r22, r9, r50 ; fnop   }\n"
                      "move %0, r22\n"
                      "move %1, r9\n"
                      "move %2, r50\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
