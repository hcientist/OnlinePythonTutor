//file: _insn_test_v2int_l_X0.c
//op=295
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

unsigned long mem[2] = { 0xcfb4af8744c008a6, 0x7da224c9da343236 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r39, -7263\n"
                      "shl16insli r39, r39, -2165\n"
                      "shl16insli r39, r39, 15401\n"
                      "shl16insli r39, r39, 3495\n"
                      "moveli r50, -16001\n"
                      "shl16insli r50, r50, 28334\n"
                      "shl16insli r50, r50, 10964\n"
                      "shl16insli r50, r50, -18458\n"
                      "moveli r49, -15860\n"
                      "shl16insli r49, r49, -32482\n"
                      "shl16insli r49, r49, 31946\n"
                      "shl16insli r49, r49, -29777\n"
                      "{ v2int_l r39, r50, r49 ; fnop   }\n"
                      "move %0, r39\n"
                      "move %1, r50\n"
                      "move %2, r49\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
