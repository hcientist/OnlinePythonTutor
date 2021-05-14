//file: _insn_test_v1add_X0.c
//op=233
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

unsigned long mem[2] = { 0xb6f11f94786226c8, 0xef169cd1658e9a9b };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r20, 27682\n"
                      "shl16insli r20, r20, 13107\n"
                      "shl16insli r20, r20, 1100\n"
                      "shl16insli r20, r20, -12585\n"
                      "moveli r21, 32493\n"
                      "shl16insli r21, r21, 14979\n"
                      "shl16insli r21, r21, 26024\n"
                      "shl16insli r21, r21, 32141\n"
                      "moveli r17, -26698\n"
                      "shl16insli r17, r17, 18738\n"
                      "shl16insli r17, r17, -23994\n"
                      "shl16insli r17, r17, -32450\n"
                      "{ v1add r20, r21, r17 ; fnop   }\n"
                      "move %0, r20\n"
                      "move %1, r21\n"
                      "move %2, r17\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
